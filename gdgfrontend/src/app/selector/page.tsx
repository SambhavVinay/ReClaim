"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

/* ================= TITLE ================= */

function PageTitleText() {
  return (
    <div className="h-[102px] relative shrink-0 w-full">
      <div className="flex flex-row justify-center size-full">
        <div className="content-stretch flex items-start justify-center pb-[6px] pl-0 pr-[10px] pt-[10px] relative size-full">
          <p className="font-[family-name:var(--font-jersey-10)] leading-[40px] not-italic relative shrink-0 text-[52px] text-white w-[310px] text-center">
            What Brings you here?
          </p>
        </div>
      </div>
    </div>
  );
}

function TitleArea() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <PageTitleText />
    </div>
  );
}

/* ================= LOST CARD ================= */

function LostPersonIllustration() {
  return (
    <div className="h-[214px] w-[166px] flex items-center justify-center">
      <img
        src="/images/Lostpersonimage.png"
        alt="Lost person"
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}

function LostCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#ff3b30] rounded-[20px] shadow cursor-pointer hover:scale-105 transition active:scale-95 w-[400px]"
    >
      <div className="flex flex-col items-center p-6 gap-4">
        <LostPersonIllustration />
        <p className="font-[family-name:var(--font-jersey-10)] text-[36px] text-white text-center">
          Lost Something?
        </p>
      </div>
    </div>
  );
}

/* ================= FOUND CARD ================= */

function FoundPersonIllustration() {
  return (
    <div className="h-[230px] w-[166px] flex items-center justify-center">
      <img
        src="/images/Founditemperson.png"
        alt="Found item"
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}

function FoundCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#007bff] rounded-[20px] cursor-pointer hover:scale-105 transition active:scale-95 w-[400px]"
    >
      <div className="flex flex-col items-center p-6 gap-4">
        <FoundPersonIllustration />
        <p className="font-[family-name:var(--font-jersey-10)] text-[36px] text-white text-center">
          Found Something?
        </p>
      </div>
    </div>
  );
}

/* ================= MAIN ================= */

export default function OptionsPage() {
  const router = useRouter();
  const [showCampus, setShowCampus] = useState(false);

  /* ✅ SWITCH BACK TO CAMPUS COMPONENT */

  return (
    <div className="bg-[#000000] flex flex-col gap-6 items-center justify-center px-5 py-12 min-h-screen">
      <TitleArea />

      {/* ✅ ROUTE TO /lost */}
      <LostCard onClick={() => router.push("/lost")} />

      {/* ✅ ROUTE TO /found */}
      <FoundCard onClick={() => router.push("/found")} />

      {/* ✅ BACK TO CAMPUS BUTTON */}
    </div>
  );
}
