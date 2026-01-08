"use client";

import { usePathname } from "next/navigation";
import GlassyNavBar from "@/app/components/navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ✅ Hide navbar only where intended
  const hideNav = pathname === "/" || pathname.startsWith("/login");

  // ✅ Only tabs that actually exist
  const activeTab = pathname.startsWith("/selector")
    ? "selector"
    : pathname.startsWith("/lost")
    ? "lost"
    : pathname.startsWith("/found")
    ? "found"
    : pathname.startsWith("/database")
    ? "discover"
    : pathname.startsWith("/profile")
    ? "profile"
    : "lost";

  return (
    <>
      <main className={hideNav ? "" : "pb-[78px]"}>{children}</main>
      {!hideNav && <GlassyNavBar activeTab={activeTab} />}
    </>
  );
}
