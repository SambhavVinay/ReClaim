"use client";

import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useState } from "react";
import {
  Search,
  Upload,
  Camera as CameraIcon,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Result {
  match: boolean;
  item: string;
  confidence: number;
}

export default function LostPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const base64ToFile = (b64: string, format: string) => {
    const bytes = atob(b64)
      .split("")
      .map((c) => c.charCodeAt(0));
    return new File([new Uint8Array(bytes)], `search.${format}`, {
      type: `image/${format}`,
    });
  };

  const pickImage = async (useGallery: boolean) => {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: useGallery ? CameraSource.Photos : CameraSource.Camera,
      quality: 90,
    });
    if (image.base64String) {
      setFile(base64ToFile(image.base64String, image.format!));
    }
  };

  const search = async () => {
    if (!file) return;

    setLoading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/search`, {
      method: "POST",
      body: fd,
    });

    setResult(await res.json());
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Search /> Visual Search
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <button onClick={() => pickImage(false)} className="btn">
          <CameraIcon /> Capture
        </button>
        <button onClick={() => pickImage(true)} className="btn">
          <Upload /> Upload
        </button>
      </div>

      <button onClick={search} className="btn-primary w-full">
        Run AI Analysis
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-xl border flex gap-3 ${
            result.match ? "bg-green-50" : "bg-red-50"
          }`}
        >
          {result.match ? <CheckCircle2 /> : <XCircle />}
          <div>
            <p className="font-bold">
              {result.match ? result.item : "No Match"}
            </p>
            <p className="text-xs">
              Confidence {(result.confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={40} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
