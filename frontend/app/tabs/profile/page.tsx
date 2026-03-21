"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserPreferences } from "@/lib/api";
import { LS_USER_ID } from "@/lib/onboarding";
import type { UserProfile } from "@/lib/types";
import { SpinningGlobe } from "@/components/spinningGlobe";

const INTEREST_OPTIONS = [
  { value: "food", label: "Food" },
  { value: "explore", label: "Explore" },
  { value: "social", label: "Social" },
];

const DIETARY_OPTIONS = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "halal", label: "Halal" },
  { value: "none", label: "No restrictions" },
];

const BUDGET_OPTIONS = [
  { value: 1, label: "¥" },
  { value: 2, label: "¥¥" },
  { value: 3, label: "¥¥¥" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [interests, setInterests] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [budget, setBudget] = useState<number>(1);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) {
      router.replace("/onboarding/intro/1");
      return;
    }

    const cached = sessionStorage.getItem("cached_profile");
    if (cached) {
      const data: UserProfile = JSON.parse(cached);
      setProfile(data);
      seedLocalState(data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getUserProfile(userId);
      setProfile(data);
      seedLocalState(data);
      sessionStorage.setItem("cached_profile", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const seedLocalState = (data: UserProfile) => {
    setInterests(data.preferences.activity_preference ?? []);
    setDietary(data.preferences.dietary ?? []);
    setBudget(data.preferences.budget ?? 1);
  };

  const toggleInterest = (value: string) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleDietary = (value: string) => {
    if (value === "none") {
      setDietary(["none"]);
    } else {
      setDietary((prev) => {
        const without = prev.filter((v) => v !== "none");
        return without.includes(value)
          ? without.filter((v) => v !== value)
          : [...without, value];
      });
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) return;

    setIsSaving(true);
    try {
      const result = await updateUserPreferences(userId, {
        activity_preference: interests,
        dietary,
        budget,
      });
      const updatedProfile = { ...profile, preferences: result.preferences };
      setProfile(updatedProfile);
      sessionStorage.setItem("cached_profile", JSON.stringify(updatedProfile));
    } catch (err) {
      console.error("Failed to update preferences:", err);
      alert("Failed to update preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (!confirm("Are you sure you want to log out?")) return;
    sessionStorage.removeItem("cached_profile");
    sessionStorage.removeItem("cached_trending_venues");
    sessionStorage.removeItem("cached_saved_ids");
    sessionStorage.removeItem("cached_saved_venues");
    sessionStorage.removeItem("cached_novi_pool");
    sessionStorage.removeItem("cached_novi_shown");
    localStorage.removeItem(LS_USER_ID);
    router.replace("/onboarding/intro/1");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <SpinningGlobe />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-gray-900 font-semibold mb-4">Failed to load profile</p>
          <button
            onClick={loadProfile}
            className="px-6 py-3 bg-secondary text-white rounded-xl font-semibold"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-6">
      <div
        className="bg-secondary px-6 text-white"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)", height: "120px" }}
      >
        <div className="max-w-md mx-auto h-full flex items-center justify-between px-4">
          <h1 className="text-[22px] font-bold">{profile.username}</h1>
          <div className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-sm">
            <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">Tokyo</span>
          </div>
        </div>
      </div>

      <div className="px-6 max-w-md mx-auto mt-6 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-[#8B8F97] uppercase tracking-wider mb-3">
            Preferences
          </h2>
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
            <div className="px-4 py-4">
              <p className="font-semibold text-gray-900 mb-3">Interests</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleInterest(opt.value)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                    style={
                      interests.includes(opt.value)
                        ? { background: "#0B4F4A", color: "#fff", borderColor: "#0B4F4A" }
                        : { background: "#fff", color: "#374151", borderColor: "#D1D5DB" }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-4">
              <p className="font-semibold text-gray-900 mb-3">Dietary</p>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleDietary(opt.value)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                    style={
                      dietary.includes(opt.value)
                        ? { background: "#0B4F4A", color: "#fff", borderColor: "#0B4F4A" }
                        : { background: "#fff", color: "#374151", borderColor: "#D1D5DB" }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-4">
              <p className="font-semibold text-gray-900 mb-3">Budget</p>
              <div className="flex gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBudget(opt.value)}
                    className="px-5 py-1.5 rounded-full text-sm font-medium border transition-colors"
                    style={
                      budget === opt.value
                        ? { background: "#0B4F4A", color: "#fff", borderColor: "#0B4F4A" }
                        : { background: "#fff", color: "#374151", borderColor: "#D1D5DB" }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-4 py-4 rounded-2xl text-white font-semibold text-base transition-opacity"
            style={{ background: "#0B4F4A", opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-[#8B8F97] uppercase tracking-wider mb-3">
            About
          </h2>
          <div className="bg-white rounded-2xl divide-y divide-gray-100 shadow-sm">
            <AboutRow
              icon={
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="How Novi works"
              onClick={() => router.push("/info/how-novi-works")}
            />
            <AboutRow
              icon={
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              label="Terms & Privacy"
              onClick={() => router.push("/info/terms")}
            />
            <AboutRow
              icon={
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                </svg>
              }
              label="Give feedback"
              onClick={() => {
                const userId = localStorage.getItem(LS_USER_ID) ?? "unknown";
                window.open(`https://docs.google.com/forms/d/e/1FAIpQLSfjj1Of30sH04IcyjPeNy-5FzauBMwNx3YfTIH1u0qvU20F9Q/viewform?usp=dialog#user_id=${userId}`, "_blank");
              }}
            />
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 py-2">Version 1.0</p>

        {/* <button onClick={handleLogout} className="w-full py-4 text-red-600 font-semibold">
          Log out
        </button> */}
      </div>
    </div>
  );
}

function AboutRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#0B4F4A" }}
        >
          {icon}
        </div>
        <p className="font-medium text-gray-900">{label}</p>
      </div>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
