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
  const [preview, setPreview] = useState<string | null>(null);
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
      const f = base64ToFile(image.base64String, image.format!);
      setFile(f);
      setPreview(`data:image/${image.format};base64,${image.base64String}`);
      setResult(null);
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
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-indigo-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          <Search className="text-indigo-400" />
          Visual Search
        </h1>

        {/* Upload / Capture Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => pickImage(false)}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white py-3 font-medium transition"
          >
            <CameraIcon size={18} />
            Capture
          </button>

          <button
            onClick={() => pickImage(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white py-3 font-medium transition"
          >
            <Upload size={18} />
            Upload
          </button>
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="mb-4">
            <p className="text-sm text-slate-300 mb-2">Selected Image</p>
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain bg-black"
              />
            </div>
          </div>
        )}

        {/* Run Button */}
        <button
          onClick={search}
          disabled={!file}
          className="w-full mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 font-semibold transition"
        >
          Run AI Analysis
        </button>

        {/* Result */}
        {result && (
          <div
            className={`mt-5 p-4 rounded-xl border flex gap-3 ${
              result.match
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {result.match ? <CheckCircle2 /> : <XCircle />}
            <div>
              <p className="font-bold">
                {result.match ? result.item : "No Match Found"}
              </p>
              <p className="text-xs opacity-80">
                Confidence {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-50"
          >
            <Loader2 className="animate-spin text-indigo-400" size={48} />
            <p className="mt-4 text-white text-sm tracking-wide">
              Analyzing image with AI…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
