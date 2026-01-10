"use client";

import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useState } from "react";
import {
  Package,
  Camera as CameraIcon,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function FoundPage() {
  const [itemFiles, setItemFiles] = useState<(File | null)[]>(
    Array(6).fill(null)
  );
  const [previews, setPreviews] = useState<(string | null)[]>(
    Array(6).fill(null)
  );
  const [itemName, setItemName] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= HELPERS ================= */

  const base64ToFile = (base64: string, format: string): File => {
    const byteCharacters = atob(base64);
    const byteNumbers = Array.from(byteCharacters).map((c) => c.charCodeAt(0));

    const blob = new Blob([new Uint8Array(byteNumbers)], {
      type: `image/${format}`,
    });

    return new File(
      [blob],
      `item_${Date.now()}_${Math.random().toString(36).slice(2)}.${format}`,
      { type: `image/${format}` }
    );
  };

  /* ================= CAMERA SLOT HANDLER ================= */

  const captureForSlot = async (index: number) => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (!image.base64String || !image.format) return;

      const file = base64ToFile(image.base64String, image.format);

      setItemFiles((prev) => {
        const copy = [...prev];
        copy[index] = file;
        return copy;
      });

      setPreviews((prev) => {
        const copy = [...prev];
        copy[index] = `data:image/${image.format};base64,${image.base64String}`;
        return copy;
      });
    } catch (err) {
      console.error("Camera cancelled or failed", err);
    }
  };

  /* ================= UPLOAD ================= */

  const uploadFound = async () => {
    const validFiles = itemFiles.filter(Boolean) as File[];

    if (!itemName || validFiles.length < 2) {
      alert("Please enter item name and upload at least 2 images");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("item_name", itemName);
    validFiles.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`${BACKEND_URL}/found`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      alert("Item registered successfully");
      setItemName("");
      setItemFiles(Array(6).fill(null));
      setPreviews(Array(6).fill(null));
    } catch {
      alert("Server error while uploading");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-indigo-950 px-4 py-10">
      {/* LOADING OVERLAY */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
            <p className="mt-4 text-white text-sm tracking-wide">
              Uploading item…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-xl mx-auto bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3 mb-6 text-white">
          <Package className="text-indigo-400" />
          <h1 className="text-xl font-bold">Inbound Registration</h1>
        </div>

        {/* ITEM NAME */}
        <input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Item description"
          className="w-full mb-6 p-4 rounded-xl bg-black/40 text-white border border-white/10 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* CAMERA GRID */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {itemFiles.map((_, i) => (
            <button
              key={i}
              onClick={() => captureForSlot(i)}
              className="relative aspect-square rounded-2xl border border-white/10 bg-black/50 hover:border-indigo-400 transition flex items-center justify-center overflow-hidden"
            >
              {previews[i] ? (
                <img
                  src={previews[i]!}
                  alt={`Item ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Plus />
                  <span className="text-xs mt-1">Image {i + 1}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* IMAGE COUNT */}
        <div className="flex items-center justify-between mb-6 text-xs">
          <span className="font-bold text-indigo-400">
            {itemFiles.filter(Boolean).length} / 6 images selected (min 2)
          </span>
          <button
            onClick={() => {
              setItemFiles(Array(6).fill(null));
              setPreviews(Array(6).fill(null));
            }}
            className="flex items-center gap-1 text-red-400 font-bold"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>

        {/* SUBMIT */}
        <button
          onClick={uploadFound}
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white py-4 rounded-2xl font-bold transition"
        >
          Commit to Database
        </button>
      </div>
    </div>
  );
}
