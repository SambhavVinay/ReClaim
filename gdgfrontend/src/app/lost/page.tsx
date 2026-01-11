"use client";

import { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import {
  Camera as CameraIcon,
  Upload,
  MapPin,
  Package,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Page() {
  const [itemName, setItemName] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const base64ToFile = (b64: string, format: string) => {
    const bytes = atob(b64)
      .split("")
      .map((c) => c.charCodeAt(0));
    return new File([new Uint8Array(bytes)], `item.${format}`, {
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
      setPreview(`data:image/${image.format};base64,${image.base64String}`);
    }
  };

  const canSubmit = Boolean(itemName && location && file && !loading);

  const submitReport = async () => {
    if (!canSubmit) return;

    setLoading(true);

    const fd = new FormData();
    fd.append("itemName", itemName);
    fd.append("location", location);
    fd.append("file", file!);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/report`, {
        method: "POST",
        body: fd,
      });

      setItemName("");
      setLocation("");
      setFile(null);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="h-14 flex items-center justify-center border-b border-[#262626]">
        <h1 className="text-base font-semibold">Report Lost Item</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full aspect-square bg-[#121212] flex items-center justify-center">
          {preview ? (
            <img src={preview} className="w-full h-full object-cover" />
          ) : (
            <button
              onClick={() => pickImage(true)}
              className="flex flex-col items-center gap-2 text-[#A8A8A8]"
            >
              <CameraIcon size={36} />
              <span className="text-sm">Add photo *</span>
            </button>
          )}
        </div>

        <div className="flex border-b border-[#262626]">
          <button
            onClick={() => pickImage(false)}
            className="flex-1 py-3 flex items-center justify-center gap-2 text-sm"
          >
            <CameraIcon size={16} />
            Camera
          </button>
          <button
            onClick={() => pickImage(true)}
            className="flex-1 py-3 flex items-center justify-center gap-2 text-sm border-l border-[#262626]"
          >
            <Upload size={16} />
            Gallery
          </button>
        </div>

        <div className="px-4">
          <div className="flex items-center gap-3 py-4 border-b border-[#262626]">
            <Package size={18} className="text-[#A8A8A8]" />
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item name"
              className="flex-1 bg-transparent placeholder-[#A8A8A8] text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 py-4 border-b border-[#262626]">
            <MapPin size={18} className="text-[#A8A8A8]" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where was it lost?"
              className="flex-1 bg-transparent placeholder-[#A8A8A8] text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#262626]">
        <button
          onClick={submitReport}
          disabled={!canSubmit}
          className={`w-full py-3 rounded-lg font-semibold text-sm ${
            canSubmit
              ? "bg-[#0095F6] text-white"
              : "bg-[#00376B] text-[#7AA7C7]"
          }`}
        >
          Report Lost Item
        </button>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Loader2 className="animate-spin text-white" size={40} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
