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
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor"><g strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}><path d="m3 9l9-7l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path><path d="M9 22V12h6v10"></path></g></svg>   
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
    <svg className={className} style={style} fill="none" viewBox="0 0 28 28" stroke="currentColor"><path fill="currentColor" d="M21 16a3 3 0 0 1 3 3v.715C24 23.292 19.79 26 14 26S4 23.433 4 19.715V19a3 3 0 0 1 3-3zm0 1.5H7a1.5 1.5 0 0 0-1.493 1.355L5.5 19v.715c0 2.674 3.389 4.785 8.5 4.785c4.926 0 8.355-2.105 8.496-4.624l.004-.161V19a1.5 1.5 0 0 0-1.355-1.493zM14 2a6 6 0 1 1 0 12a6 6 0 0 1 0-12m0 1.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9"></path></svg>
  );
}
