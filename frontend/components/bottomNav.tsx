"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { id: "home", label: "Home", icon: HomeIcon, path: "/tabs/home" },
    { id: "saved", label: "Saved", icon: BookmarkIcon, path: "/tabs/saved" },
    { id: "profile", label: "Profile", icon: ProfileIcon, path: "/tabs/profile" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
          >
            <tab.icon
              className="w-6 h-6 mb-1"
              style={{ color: isActive(tab.path) ? "#0D4A4A" : "#9CA3AF" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: isActive(tab.path) ? "#0D4A4A" : "#9CA3AF" }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BookmarkIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function ProfileIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
