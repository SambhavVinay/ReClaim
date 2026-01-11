import os
import io
from datetime import timedelta
from typing import List, Dict

import torch
from PIL import Image

# FastAPI
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
    BackgroundTasks
)
from fastapi.middleware.cors import CORSMiddleware

# Google Cloud
from google.cloud import storage
from google.auth import default
from google.auth.transport import requests

# CLIP
from transformers import CLIPProcessor, CLIPModel

# =============================
# FASTAPI APP
# =============================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# GCS SETUP
# =============================
BUCKET_NAME = "campus-finder-bucket"

gcp_credentials, project_id = default()
storage_client = storage.Client(credentials=gcp_credentials)
bucket = storage_client.bucket(BUCKET_NAME)

# =============================
# DEVICE
# =============================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =============================
# CLIP SINGLETON
# =============================
clip_model: CLIPModel | None = None
clip_processor: CLIPProcessor | None = None

# =============================
# EMBEDDING CACHE
# =============================
embedding_cache: Dict[str, List[torch.Tensor]] = {}

# =============================
# LOAD CLIP ON STARTUP
# =============================
@app.on_event("startup")
def load_clip_on_startup():
    global clip_model, clip_processor

    if clip_model is None:
        clip_model = CLIPModel.from_pretrained(
            "openai/clip-vit-base-patch32"
        ).to(device)

        clip_processor = CLIPProcessor.from_pretrained(
            "openai/clip-vit-base-patch32",
            use_fast=True
        )

        clip_model.eval()
        print("✅ CLIP loaded")

# =============================
# BATCH EMBEDDINGS
# =============================
def get_embeddings(image_bytes_list: List[bytes]) -> torch.Tensor:
    images = []

    for b in image_bytes_list:
        img = Image.open(io.BytesIO(b)).convert("RGB")
        img.thumbnail((512, 512))
        images.append(img)

    inputs = clip_processor(
        images=images,
        return_tensors="pt"
    ).to(device)

    with torch.no_grad():
        feats = clip_model.get_image_features(**inputs)

    feats = feats / feats.norm(dim=-1, keepdim=True).clamp(min=1e-6)
    return feats.cpu()

# =============================
# BACKGROUND TASK (🔥)
# =============================
def generate_and_upload_embeddings(
    item_name: str,
    image_bytes: List[bytes],
    filenames: List[str]
):
    try:
        embeddings = get_embeddings(image_bytes)

        for filename, emb in zip(filenames, embeddings):
            emb = emb.unsqueeze(0)

            buffer = io.BytesIO()
            torch.save(emb, buffer)
            buffer.seek(0)

            bucket.blob(
                f"{item_name}/{filename}.pt"
            ).upload_from_string(buffer.read())

            embedding_cache.setdefault(item_name, []).append(emb)

        print(f"✅ Embeddings done for {item_name}")

    except Exception as e:
        print(f"❌ Embedding bg task failed: {e}")

# =============================
# HEALTH
# =============================
@app.get("/")
async def root():
    return {"status": "online"}

# =============================
# REPORT FOUND (FAST RESPONSE)
# =============================
@app.post("/found")
async def report_found(
    background_tasks: BackgroundTasks,
    item_name: str = Form(...),
    files: List[UploadFile] = File(...)
):
    if len(files) > 6:
        raise HTTPException(400, "Max 6 images allowed")

    image_bytes = []
    filenames = []

    try:
        for file in files:
            content = await file.read()
            image_bytes.append(content)
            filenames.append(file.filename)

            # 🚀 Upload images first
            bucket.blob(
                f"{item_name}/{file.filename}"
            ).upload_from_string(
                content,
                content_type=file.content_type
            )

        # 🔥 Run embeddings AFTER response
        background_tasks.add_task(
            generate_and_upload_embeddings,
            item_name,
            image_bytes,
            filenames
        )

        return {
            "status": "success",
            "message": f"{item_name} images uploaded. Processing embeddings..."
        }

    except Exception as e:
        raise HTTPException(500, str(e))

# =============================
# SEARCH
# =============================
@app.post("/search")
async def search_item(file: UploadFile = File(...)):
    try:
        query_bytes = await file.read()
        query_vec = get_embeddings([query_bytes])

        if not embedding_cache:
            blobs = storage_client.list_blobs(BUCKET_NAME)
            for blob in blobs:
                if blob.name.endswith(".pt"):
                    folder = blob.name.split("/")[0]
                    vec = torch.load(
                        io.BytesIO(blob.download_as_bytes()),
                        map_location="cpu"
                    )
                    embedding_cache.setdefault(folder, []).append(vec)

        best_score = -1.0
        best_item = None

        for item, vecs in embedding_cache.items():
            master = torch.mean(
                torch.cat(vecs, dim=0),
                dim=0,
                keepdim=True
            )

            master = master / master.norm(dim=-1, keepdim=True)
            score = torch.sum(query_vec * master).item()

            if score > best_score:
                best_score = score
                best_item = item

        return {
            "match": best_score > 0.8,
            "item": best_item,
            "confidence": round(best_score, 3)
        }

    except Exception as e:
        raise HTTPException(500, str(e))

# =============================
# RUN
# =============================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8080))
    )
