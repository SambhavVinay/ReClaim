import os
import io
from datetime import timedelta

import torch
from PIL import Image

# FastAPI
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
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
    allow_headers=["*"]
)


# =============================
# GCS SETUP
# =============================
BUCKET_NAME = "campus-finder-bucket"

gcp_credentials, project_id = default()
storage_client = storage.Client(credentials=gcp_credentials)
bucket = storage_client.bucket(BUCKET_NAME)


# =============================
# CLIP MODEL SETUP
# =============================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

clip_model = None
clip_processor = None

import os

def load_clip():
    global clip_model, clip_processor

    if clip_model is None or clip_processor is None:
        token = os.getenv("HF_TOKEN")

        clip_model = CLIPModel.from_pretrained(
            "openai/clip-vit-base-patch32",
            token=token
        ).to(device)

        clip_processor = CLIPProcessor.from_pretrained(
            "openai/clip-vit-base-patch32",
            token=token
        )

        clip_model.eval()




# =============================
# EMBEDDING FUNCTION
# =============================
def get_embedding(image_bytes: bytes) -> torch.Tensor:
    load_clip()  # 👈 THIS IS THE KEY FIX

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    inputs = clip_processor(
        images=image,
        return_tensors="pt"
    ).to(device)

    with torch.no_grad():
        image_features = clip_model.get_image_features(**inputs)

    image_features = image_features / image_features.norm(
        dim=-1, keepdim=True
    ).clamp(min=1e-6)

    return image_features



# =============================
# HEALTH CHECK
# =============================
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "CLIP Backend Online (Public Mode)"
    }


# =============================
# GET IMAGES IN FOLDER
# =============================
@app.get("/get-folder-images")
async def get_folder_images(folder: str):
    try:
        prefix = f"{folder}/"
        blobs = storage_client.list_blobs(
            BUCKET_NAME,
            prefix=prefix
        )

        gcp_credentials.refresh(requests.Request())

        image_urls = []
        for blob in blobs:
            if blob.name == prefix:
                continue
            if blob.name.endswith(".pt"):
                continue

            url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(hours=1),
                service_account_email=gcp_credentials.service_account_email,
                access_token=gcp_credentials.token,
                method="GET"
            )
            image_urls.append(url)

        return {"images": image_urls}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# =============================
# LIST ITEMS WITH THUMBNAILS
# =============================
@app.get("/items-list")
async def list_items_with_thumbnails():
    try:
        gcp_credentials.refresh(requests.Request())
        blobs = list(storage_client.list_blobs(BUCKET_NAME))

        item_map = {}
        for blob in blobs:
            if "/" not in blob.name:
                continue
            if blob.name.endswith(".pt"):
                continue

            folder_name = blob.name.split("/")[0]

            if folder_name not in item_map:
                url = blob.generate_signed_url(
                    version="v4",
                    expiration=timedelta(hours=1),
                    service_account_email=gcp_credentials.service_account_email,
                    access_token=gcp_credentials.token,
                    method="GET"
                )
                item_map[folder_name] = url

        return {
            "items": [
                {"name": name, "thumbnail": url}
                for name, url in item_map.items()
            ]
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# =============================
# REPORT FOUND ITEM
# =============================
@app.post("/found")
async def report_found(
    item_name: str = Form(...),
    files: list[UploadFile] = File(...)
):
    try:
        for file in files:
            content = await file.read()

            # Upload image
            img_blob = bucket.blob(
                f"{item_name}/{file.filename}"
            )
            img_blob.upload_from_string(
                content,
                content_type=file.content_type
            )

            # Generate embedding
            embedding = get_embedding(content).cpu()

            # Save embedding
            buffer = io.BytesIO()
            torch.save(embedding, buffer)
            buffer.seek(0)

            emb_blob = bucket.blob(
                f"{item_name}/{file.filename}.pt"
            )
            emb_blob.upload_from_string(buffer.read())

        return {
            "status": "success",
            "message": f"{item_name} registered"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================
# SEARCH ITEM
# =============================
@app.post("/search")
async def search_item(file: UploadFile = File(...)):
    try:
        query_bytes = await file.read()
        query_vec = get_embedding(query_bytes)

        blobs = storage_client.list_blobs(BUCKET_NAME)

        item_vectors = {}

        for blob in blobs:
            if not blob.name.endswith(".pt"):
                continue

            folder = blob.name.split("/")[0]

            buffer = io.BytesIO(blob.download_as_bytes())
            vec = torch.load(buffer, map_location=device)

            if folder not in item_vectors:
                item_vectors[folder] = []

            item_vectors[folder].append(vec)

        best_score = -1.0
        best_item = None

        for item, vecs in item_vectors.items():
            master_vec = torch.mean(
                torch.stack(vecs),
                dim=0
            )

            master_vec = master_vec / master_vec.norm(
                dim=-1, keepdim=True
            ).clamp(min=1e-6)

            score = torch.sum(
                query_vec * master_vec
            ).item()

            if score > best_score:
                best_score = score
                best_item = item

        return {
            "match": best_score > 0.8,
            "item": best_item,
            "confidence": round(best_score, 3)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================
# LOCAL RUN (OPTIONAL)
# =============================
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )
