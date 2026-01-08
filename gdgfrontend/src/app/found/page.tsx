"use client";

import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useState } from "react";
import {
  Package,
  Upload,
  Camera as CameraIcon,
  Trash2,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function FoundPage() {
  const [itemFiles, setItemFiles] = useState<File[]>([]);
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

  /* ================= IMAGE INPUT ================= */

  const handleImageInput = async (useGallery: boolean) => {
    try {
      if (useGallery) {
        const photos = await Camera.pickImages({
          quality: 90,
          limit: 6 - itemFiles.length,
        });

        const files = await Promise.all(
          photos.photos.map(async (p) => {
            if (!p.webPath || !p.format) return null;

            const blob = await (await fetch(p.webPath)).blob();
            return new File(
              [blob],
              `gallery_${Date.now()}_${Math.random().toString(36).slice(2)}.${
                p.format
              }`,
              { type: `image/${p.format}` }
            );
          })
        );

        setItemFiles((prev) => [...prev, ...(files.filter(Boolean) as File[])]);
      } else {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
        });

        /* ✅ TYPE-SAFE GUARD */
        if (!image.base64String || !image.format) {
          console.error("Camera returned incomplete image data");
          return;
        }

        const file = base64ToFile(image.base64String, image.format);
        setItemFiles((prev) => [...prev, file]);
      }
    } catch (error) {
      console.error("Image input cancelled or failed", error);
    }
  };

  /* ================= UPLOAD ================= */

  const uploadFound = async () => {
    if (!itemName || itemFiles.length === 0) {
      alert("Please provide item name and at least one image");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("item_name", itemName);
    itemFiles.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`${BACKEND_URL}/found`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      alert("Item registered successfully");
      setItemFiles([]);
      setItemName("");
    } catch (err) {
      alert("Server error while uploading");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6">
      {/* LOADING OVERLAY */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          >
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <Package className="text-indigo-600" />
          <h1 className="text-xl font-bold">Inbound Registration</h1>
        </div>

        <input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Item description"
          className="w-full mb-4 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => handleImageInput(false)}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border hover:border-indigo-400 transition"
          >
            <CameraIcon className="mb-2" />
            <span className="text-xs font-bold">Capture</span>
          </button>

          <button
            onClick={() => handleImageInput(true)}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border hover:border-indigo-400 transition"
          >
            <Upload className="mb-2" />
            <span className="text-xs font-bold">Browse</span>
          </button>
        </div>

        {itemFiles.length > 0 && (
          <div className="flex items-center justify-between mb-4 text-xs">
            <span className="font-bold text-indigo-600">
              {itemFiles.length} images selected
            </span>
            <button
              onClick={() => setItemFiles([])}
              className="flex items-center gap-1 text-red-500 font-bold"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>
        )}

        <button
          onClick={uploadFound}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 transition"
        >
          Commit to Database
        </button>
      </div>
    </div>
  );
}
