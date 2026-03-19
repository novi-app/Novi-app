"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserPreferences } from "@/lib/api";
import { LS_USER_ID } from "@/lib/onboarding";
import type { UserProfile } from "@/lib/types";
import { SpinningGlobe } from "@/components/spinningGlobe";

const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "none", label: "No restrictions" },
];

const BUDGET_OPTIONS = [
  { value: 1, label: "Budget-friendly", symbol: "¥" },
  { value: 2, label: "Moderate", symbol: "¥¥" },
  { value: 3, label: "Treat yourself", symbol: "¥¥¥" },
];

const EXCLUDE_CATEGORIES = [
  { value: "nightclub", label: "Nightclubs" },
  { value: "casino", label: "Casinos" },
  { value: "adult_entertainment", label: "Adult venues" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem(LS_USER_ID);
      if (!userId) {
        router.replace("/onboarding/intro/1");
        return;
      }

      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreferences = async (updates: Partial<UserProfile["preferences"]>) => {
    if (!profile) return;

    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) return;

    try {
      const result = await updateUserPreferences(userId, updates);
      setProfile({ ...profile, preferences: result.preferences });
      setEditingField(null);
    } catch (err) {
      console.error("Failed to update preferences:", err);
      alert("Failed to update preferences. Please try again.");
    }
  };

  const handleLogout = () => {
    if (!confirm("Are you sure you want to log out?")) return;
    
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

  const dietaryLabels = profile.preferences.dietary
    .map((d) => DIETARY_OPTIONS.find((o) => o.value === d)?.label)
    .filter(Boolean)
    .join(", ") || "None";

  const budgetLabel = BUDGET_OPTIONS.find((o) => o.value === profile.preferences.budget)?.symbol || "¥¥";

  const excludedLabels = (profile.preferences.excluded_categories || [])
    .map((c) => EXCLUDE_CATEGORIES.find((o) => o.value === c)?.label)
    .filter(Boolean)
    .join(", ") || "None";

  return (
    <div className="min-h-screen bg-cream pb-6">
      <div
        className="bg-white px-6 pb-6 shadow-sm"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)" }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-white text-2xl font-bold">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Currently in Tokyo
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 max-w-md mx-auto mt-6 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Preferences
          </h2>
          <div className="bg-white rounded-2xl divide-y divide-gray-100 shadow-sm">
            <PreferenceRow
              label="Dietary restrictions"
              value={dietaryLabels}
              onClick={() => setEditingField("dietary")}
            />
            <PreferenceRow
              label="Budget"
              value={budgetLabel}
              onClick={() => setEditingField("budget")}
            />
            <PreferenceRow
              label="Never show"
              value={excludedLabels}
              onClick={() => setEditingField("excluded")}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Account
          </h2>
          <div className="bg-white rounded-2xl divide-y divide-gray-100 shadow-sm">
            <SettingRow label="Notifications" onClick={() => {}} />
            <SettingRow label="Privacy" onClick={() => {}} />
            <SettingRow label="Connected accounts" onClick={() => {}} />
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            About
          </h2>
          <div className="bg-white rounded-2xl divide-y divide-gray-100 shadow-sm">
            <SettingRow label="How Novi works" onClick={() => {}} />
            <SettingRow label="Terms & Privacy" onClick={() => {}} />
            <SettingRow label="Give feedback" onClick={() => {}} />
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 py-2">Version 1.0</p>

        <button
          onClick={handleLogout}
          className="w-full py-4 text-red-600 font-semibold"
        >
          Log out
        </button>
      </div>

      {editingField === "dietary" && (
        <EditModal
          title="Dietary restrictions"
          onClose={() => setEditingField(null)}
        >
          <div className="space-y-2">
            {DIETARY_OPTIONS.map((option) => {
              const isSelected = profile.preferences.dietary.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    const newDietary = isSelected
                      ? profile.preferences.dietary.filter((d) => d !== option.value)
                      : [...profile.preferences.dietary.filter((d) => d !== "none"), option.value];
                    handleUpdatePreferences({ dietary: option.value === "none" ? ["none"] : newDietary });
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl ${
                    isSelected ? "bg-secondary text-white" : "bg-gray-50 text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </EditModal>
      )}

      {editingField === "budget" && (
        <EditModal title="Budget" onClose={() => setEditingField(null)}>
          <div className="space-y-2">
            {BUDGET_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleUpdatePreferences({ budget: option.value })}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${
                  profile.preferences.budget === option.value
                    ? "bg-secondary text-white"
                    : "bg-gray-50 text-gray-700"
                }`}
              >
                <span className="font-bold">{option.symbol}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </EditModal>
      )}

      {editingField === "excluded" && (
        <EditModal title="Never show" onClose={() => setEditingField(null)}>
          <div className="space-y-2">
            {EXCLUDE_CATEGORIES.map((option) => {
              const excluded = profile.preferences.excluded_categories || [];
              const isSelected = excluded.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    const newExcluded = isSelected
                      ? excluded.filter((c) => c !== option.value)
                      : [...excluded, option.value];
                    handleUpdatePreferences({ excluded_categories: newExcluded });
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl ${
                    isSelected ? "bg-secondary text-white" : "bg-gray-50 text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </EditModal>
      )}
    </div>
  );
}

function PreferenceRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full px-4 py-4 flex items-center justify-between">
      <div className="text-left">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500 mt-0.5">{value}</p>
      </div>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function SettingRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full px-4 py-4 flex items-center justify-between">
      <p className="font-medium text-gray-900">{label}</p>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function EditModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white flex flex-col max-h-[70vh]"
        style={{ borderRadius: "20px 20px 0 0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 rounded-full bg-gray-300" style={{ height: "4px" }} />
        </div>
        <div className="px-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
