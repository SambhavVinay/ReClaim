"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import AuthGate from "@/app/components/AuthGate";

const backgroundImage = "/images/getstartedbg.png";

export default function GetStartedPage() {
  const [showAuthGate, setShowAuthGate] = useState(false);

  const onGetStarted = () => {
    setShowAuthGate(true);
  };

  return (
    <div className="bg-[#0F172A] min-h-screen overflow-y-auto">
      {showAuthGate && <AuthGate />}

      {!showAuthGate && (
        <div className="relative h-screen flex flex-col">
          {/* Background Image */}
          <div className="absolute inset-0 h-[70vh] top-0">
            <img
              src={backgroundImage}
              alt="Background"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="relative h-[50vh] bg-gradient-to-b from-transparent to-[#0F172A] to-[30%] flex flex-col justify-end pb-32 px-6">
              <div className="text-center space-y-6">
                <h1 className="font-[family-name:var(--font-jersey-10)] text-[56px] text-white">
                  Reclaim
                </h1>
                <p className="font-[family-name:var(--font-jersey-10)] text-[18px] text-[#a2a2a2] max-w-sm mx-auto">
                  A community-powered platform helping you recover lost
                  belongings
                </p>
              </div>
            </div>
          </div>

          {/* Button */}
          <div className="fixed bottom-0 left-0 right-0 z-30 px-6 pb-12 pt-4 bg-[#0F172A]">
            <button
              onClick={onGetStarted}
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] transition-all rounded-[16px] px-6 py-5 flex items-center justify-center gap-2"
            >
              <span className="font-[family-name:var(--font-jersey-10)] text-[24px] text-white">
                Get Started
              </span>
              <ArrowRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
