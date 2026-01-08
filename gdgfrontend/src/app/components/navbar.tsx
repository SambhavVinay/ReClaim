"use client";

import Link from "next/link";
import { Search, PackagePlus, Compass, User, Home } from "lucide-react";

type NavTab = "selector" | "lost" | "found" | "discover" | "profile";

interface GlassyNavBarProps {
  activeTab?: NavTab;
}

export default function GlassyNavBar({
  activeTab = "lost",
}: GlassyNavBarProps) {
  const tabs = [
    {
      id: "selector" as NavTab,
      href: "/selector",
      icon: Home,
    },
    {
      id: "lost" as NavTab,
      href: "/lost",
      icon: Search,
    },
    {
      id: "found" as NavTab,
      href: "/found",
      icon: PackagePlus,
    },
    {
      id: "discover" as NavTab,
      href: "/database",
      icon: Compass,
    },
    {
      id: "profile" as NavTab,
      href: "/profile",
      icon: User,
    },
  ];

  const getActiveIndex = () =>
    Math.max(
      0,
      tabs.findIndex((t) => t.id === activeTab)
    );

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        fontFamily: "Poppins, system-ui, sans-serif",
        background: "rgba(29, 31, 36, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Menu List */}
      <div className="flex items-center justify-center pb-[4px] pt-[12px] px-[12px] relative">
        {/* Sliding active background */}
        <div
          className="absolute transition-all duration-500 ease-out"
          style={{
            left: `calc(12px + ${getActiveIndex()} * (100% - 24px) / 5)`,
            width: `calc((100% - 24px) / 5)`,
            top: "12px",
            height: "48px",
            background: "rgba(167, 139, 250, 0.2)",
            boxShadow:
              "0 0 20px rgba(167, 139, 250, 0.4), inset 0 0 20px rgba(167, 139, 250, 0.1)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(167, 139, 250, 0.3)",
            borderRadius: "100px",
            pointerEvents: "none",
          }}
        />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <div
              key={tab.id}
              className="flex flex-col items-center justify-center flex-1 relative"
            >
              <Link
                href={tab.href}
                className="flex items-center justify-center p-[12px] relative rounded-[100px] shrink-0 transition-all duration-300"
              >
                <div className="w-[24px] h-[24px] flex items-center justify-center">
                  <Icon
                    size={24}
                    strokeWidth={2}
                    stroke={isActive ? "#a78bfa" : "#676D75"}
                    fill="none"
                    className="transition-all duration-300"
                    style={{
                      filter: isActive
                        ? "drop-shadow(0 0 4px rgba(167, 139, 250, 0.6))"
                        : "none",
                    }}
                  />
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* iPhone Indicator */}
      <div
        className="h-[30px] relative"
        style={{ background: "rgba(29, 31, 36, 0.5)" }}
      >
        <div
          className="absolute bottom-[8px] h-[5px] left-1/2 rounded-[100px] -translate-x-1/2 w-[135px]"
          style={{
            background: "rgba(185, 192, 201, 0.5)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
          }}
        />
      </div>
    </div>
  );
}
