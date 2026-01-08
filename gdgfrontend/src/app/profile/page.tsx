"use client";

import { useEffect, useState } from "react";
import { User, Settings, Bell, LogOut, ChevronRight, X } from "lucide-react";
import { auth } from "@/app/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
export default function ProfilePage() {
  const firebaseUser = auth.currentUser;
  const router = useRouter();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [mobileNumber, setMobileNumber] = useState("");
  const [isEditingNumber, setIsEditingNumber] = useState(false);

  const userName = firebaseUser?.displayName ?? "Unknown User";
  const userEmail = firebaseUser?.email ?? "No email";
  const photoURL = firebaseUser?.photoURL;

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await signOut(auth);
      router.replace("/");
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  /* ---------------- EDIT PROFILE VIEW ---------------- */
  if (showEditProfile) {
    return (
      <div className="bg-[#0F172A] min-h-screen flex items-center justify-center p-4 pb-32">
        <div className="bg-[#1E293B] p-10 rounded-xl w-full max-w-2xl shadow-2xl border border-white/10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center overflow-hidden">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#0F172A] text-xl font-bold">
                  {getInitials(userName)}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <p className="text-white">{userName}</p>
              <p className="text-gray-400 text-sm">{userEmail}</p>
            </div>

            <button
              onClick={() => setShowEditProfile(false)}
              className="ml-auto"
            >
              <X className="text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-6 mb-10">
            <Row label="Name" value={userName} />
            <Row label="Email" value={userEmail} />

            {/* Mobile */}
            <div className="flex justify-between items-center">
              <p className="text-white">Mobile number</p>
              {isEditingNumber ? (
                <div className="flex gap-2">
                  <input
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="bg-[#334155] px-3 py-1 rounded text-sm text-white"
                    placeholder="+91 XXXXXXXX"
                  />
                  <button
                    onClick={() => setIsEditingNumber(false)}
                    className="text-green-400 text-sm"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingNumber(true)}
                  className="text-green-400 text-sm"
                >
                  {mobileNumber || "Add number"}
                </button>
              )}
            </div>

            <Row label="Location" value="RV University" />
          </div>

          <button className="bg-green-400 px-6 py-2 rounded text-black font-semibold">
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- SETTINGS VIEW ---------------- */
  if (showSettings) {
    return (
      <div className="bg-[#0F172A] min-h-screen flex items-center justify-center p-4">
        <div className="bg-[#1E293B] p-6 rounded-xl w-full max-w-sm border border-white/10">
          <div className="flex justify-between mb-4">
            <p className="text-white">Settings</p>
            <button onClick={() => setShowSettings(false)}>
              <X className="text-gray-400 hover:text-white" />
            </button>
          </div>

          <button className="w-full flex justify-between p-3 hover:bg-slate-700 rounded">
            <span className="text-white">Theme</span>
            <ChevronRight className="text-gray-400 rotate-90" />
          </button>

          <button className="w-full flex justify-between p-3 hover:bg-slate-700 rounded">
            <span className="text-white">Language</span>
            <ChevronRight className="text-gray-400 rotate-90" />
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- MAIN PROFILE VIEW ---------------- */
  return (
    <div className="bg-[#0F172A] min-h-screen flex items-center justify-center p-4 pb-32">
      <div className="bg-[#1E293B] p-6 rounded-xl w-full max-w-sm border border-white/10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center overflow-hidden">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#0F172A] text-xl font-bold">
                {getInitials(userName)}
              </span>
            )}
          </div>

          <div>
            <p className="text-white text-sm">{userName}</p>
            <p className="text-gray-400 text-xs">{userEmail}</p>
          </div>
        </div>

        <Divider />

        <MenuButton
          icon={<User className="text-white" />}
          label="My Profile"
          onClick={() => setShowEditProfile(true)}
        />

        <MenuButton
          icon={<Settings className="text-white" />}
          label="Settings"
          onClick={() => setShowSettings(true)}
        />

        <MenuButton
          icon={<Bell className="text-white" />}
          label="Notification"
          rightText={notificationsEnabled ? "Allow" : "Off"}
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
        />

        <MenuButton
          icon={<LogOut className="text-white" />}
          label="Log Out"
          onClick={handleSignOut}
        />
      </div>
    </div>
  );
}

/* ---------- SMALL HELPERS ---------- */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <p className="text-white">{label}</p>
      <p className="text-gray-400">{value}</p>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/10 my-3" />;
}

function MenuButton({
  icon,
  label,
  rightText,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  rightText?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex justify-between items-center p-3 hover:bg-slate-700 rounded"
    >
      <div className="flex gap-3 items-center">
        {icon}
        <span className="text-white text-sm">{label}</span>
      </div>
      {rightText && <span className="text-gray-400 text-xs">{rightText}</span>}
    </button>
  );
}
