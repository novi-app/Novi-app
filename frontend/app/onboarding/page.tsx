"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";
import { Button } from "@/components/button";
import { Card } from "@/components/card";

// =============================================================================
// DATA CONSTANTS
// =============================================================================

const dietaryOptions = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "halal", label: "Halal" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "no-restrictions", label: "No Restrictions" },
];

const activityOptions = [
  { id: "cafes", label: "Cafes" },
  { id: "outdoor", label: "Outdoor" },
  { id: "nightlife", label: "Nightlife" },
  { id: "shopping", label: "Shopping" },
  { id: "workshops", label: "Workshops" },
  { id: "museums", label: "Museums" },
  { id: "temples", label: "Temples & Shrines" },
  { id: "arcades", label: "Arcades & Gaming" },
  { id: "onsen", label: "Onsen & Wellness" },
];

const vibeOptions = [
  { id: "lively", title: "Lively & Social", description: "Energetic atmosphere", emoji: "🎉" },
  { id: "intimate", title: "Intimate & Quiet", description: "Peaceful and calm", emoji: "🕯️" },
  { id: "authentic", title: "Authentic Local", description: "Where locals eat", emoji: "🍜" },
  { id: "tourist", title: "Tourist-Friendly", description: "English menus, easy", emoji: "✨" },
];

const travelStyleOptions = [
  { id: "adventurer", title: "Adventurer", description: "Love trying new things and hidden gems", emoji: "🧭" },
  { id: "planner", title: "Planner", description: "Prefer well-reviewed, reliable spots", emoji: "📝" },
  { id: "spontaneous", title: "Spontaneous", description: "Go with the flow, surprise me", emoji: "🎲" },
  { id: "cultural", title: "Cultural Explorer", description: "Deep dive into local traditions", emoji: "🏯" },
];

// TODO: Replace with i18n/config — currency should be locale-aware
// Using ¥ (yen) since this is a Japan-focused app
const budgetLabels = ["¥", "¥¥", "¥¥¥"];
const budgetDescriptions = [
  "Budget-friendly (under ¥1,500)",
  "Mid-range (¥1,500 - ¥3,500)",
  "Premium (¥3,500+)",
];

// =============================================================================
// Note: colors from @/lib/theme are used for SVG stroke/fill attributes
// which cannot use Tailwind classes. All other styling uses Tailwind tokens.

// =============================================================================
// PROGRESS DOTS COMPONENT
// FIX: Single role="progressbar" on the container instead of on every dot.
// =============================================================================

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-4"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, index) => (
        // Purely visual — no role needed on individual dots
        <div
          key={index}
          aria-hidden="true"
          className={`h-2 rounded-full transition-all duration-300 ${
            index <= current ? "w-6 bg-teal" : "w-2 bg-neutral-300"
          }`}
        />
      ))}
      <span className="ml-3 text-sm text-neutral-500" aria-hidden="true">
        Step {current + 1} of {total}
      </span>
    </div>
  );
}

// =============================================================================
// SVG ICONS
// =============================================================================

function TravelerIcon() {
  return (
    <div className="w-32 h-32 mx-auto mb-8 relative">
      <div className="w-full h-full rounded-full flex items-center justify-center bg-rose-light">
        <svg viewBox="0 0 100 100" className="w-20 h-20" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="35" stroke={colors.rose.DEFAULT} strokeWidth="3" fill="none" />
          <ellipse cx="50" cy="50" rx="15" ry="35" stroke={colors.rose.DEFAULT} strokeWidth="2" fill="none" />
          <line x1="15" y1="50" x2="85" y2="50" stroke={colors.rose.DEFAULT} strokeWidth="2" />
          <line x1="50" y1="15" x2="50" y2="85" stroke={colors.rose.DEFAULT} strokeWidth="2" />
          <circle cx="65" cy="30" r="8" fill={colors.rose.DEFAULT} />
          <path d="M55 45 L65 40 L75 45 L72 70 L58 70 Z" fill={colors.rose.DEFAULT} />
        </svg>
      </div>
    </div>
  );
}

function LocationIcon() {
  return (
    <div className="w-32 h-32 mx-auto mb-8 relative">
      <div className="w-full h-full rounded-full flex items-center justify-center relative bg-rose-light">
        {/* Location pin with inner circle */}
        <svg viewBox="0 0 40 50" className="w-14 h-16" fill="none" aria-hidden="true">
          <path
            d="M20 0C9 0 0 9 0 20c0 15 18 28.5 19 29.3c0.6 0.5 1.4 0.5 2 0C22 48.5 40 35 40 20C40 9 31 0 20 0z"
            fill={colors.rose.DEFAULT}
          />
          <circle cx="20" cy="18" r="7" fill="white" />
          <circle cx="20" cy="18" r="3.5" fill={colors.rose.DEFAULT} />
        </svg>
        {/* Shield badge at bottom right */}
        <div className="absolute bottom-2 right-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white bg-white shadow-md">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
              <path
                d="M12 2L4 6v6c0 5.25 3.4 10.1 8 11.25C16.6 22.1 20 17.25 20 12V6l-8-4z"
                stroke={colors.rose.DEFAULT}
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// BUDGET SLIDER COMPONENT
// FIX: Track fill uses max() so the thumb is always visible at value = 0.
// =============================================================================

function BudgetSlider({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (val: number) => void;
  label: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-neutral-800 mb-1">{label}</p>
      <p className="text-xs text-neutral-500 mb-3">
        How much do you typically want to spend?
      </p>
      <div className="relative">
        <div className="flex justify-between mb-2">
          {budgetLabels.map((bl, idx) => (
            <button
              key={bl}
              onClick={() => onChange(idx)}
              aria-pressed={idx === value}
              aria-label={`${bl} - ${budgetDescriptions[idx]}`}
              className={`text-lg font-semibold transition-colors ${
                idx === value ? "text-teal" : "text-neutral-400"
              }`}
            >
              {bl}
            </button>
          ))}
        </div>
        <div className="relative h-1 bg-neutral-200 rounded-full">
          {/* FIX: max(10px, ...) keeps the thumb visible when value is 0 */}
          <div
            className="absolute h-1 rounded-full transition-all duration-300 bg-teal"
            style={{ width: `max(10px, ${(value / 2) * 100}%)` }}
          />
          <input
            type="range"
            min="0"
            max="2"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`${label} slider`}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md transition-all duration-300 bg-teal"
            style={{ left: `calc(${(value / 2) * 100}% - 10px)` }}
          />
        </div>
        <p className="text-center text-sm text-neutral-600 mt-3">
          {budgetDescriptions[value]}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// PILL COMPONENT (for dietary/activity selection)
// =============================================================================

function Pill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`
        px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-200 border
        ${selected
          ? "text-white border-teal bg-teal"
          : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
        }
      `}
    >
      {label}
    </button>
  );
}

// =============================================================================
// SELECTION CARD (for vibes and travel style)
// FIX: Removed aria-pressed — only aria-checked is correct for checkbox/radio roles.
// =============================================================================

function SelectionCard({
  emoji,
  title,
  description,
  selected,
  onClick,
  multiSelect = false,
}: {
  emoji: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  multiSelect?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      role={multiSelect ? "checkbox" : "radio"}
      aria-checked={selected}
      className={`
        w-full p-4 rounded-3xl border-2 text-left
        transition-all duration-300 ease-smooth flex items-center gap-4
        ${selected
          ? "shadow-lg scale-[1.01] bg-teal-light border-teal shadow-teal/15"
          : "bg-white border-neutral-200 hover:shadow-md hover:border-neutral-300"
        }
      `}
    >
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <div className="flex-1">
        <p className={`font-semibold ${selected ? "text-neutral-900" : "text-neutral-800"}`}>
          {title}
        </p>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <div
        aria-hidden="true"
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
          selected ? "border-teal bg-teal" : "border-neutral-300 bg-white"
        }`}
      >
        {selected && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

// =============================================================================
// STEP COMPONENTS
// =============================================================================

function HowItWorksStep({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center pt-8">
      <TravelerIcon />

      <h1 className="text-2xl font-bold text-neutral-900 mb-4">
        How Novi Works
      </h1>

      <p className="text-neutral-600 mb-8 leading-relaxed">
        We curate the best choices for you.
        <br />
        If you're still stuck, we'll nudge you in
        <br />
        the right direction.
      </p>

      <Card
        variant="default"
        padding="lg"
        className="flex items-center justify-center gap-4 mb-10 rounded-3xl bg-neutral-50 border-none shadow-none"
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-neutral-900">18+ min</p>
          <p className="text-xs text-neutral-500">lost to scrolling</p>
        </div>
        <div className="text-neutral-400" aria-hidden="true">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-neutral-900">&lt; 5 min</p>
          <p className="text-xs text-neutral-500">back to exploring</p>
        </div>
      </Card>

      <div className="w-full space-y-3">
        <Button
          onClick={onNext}
          fullWidth
          size="lg"
          className="h-14 rounded-2xl bg-teal hover:bg-teal-hover active:bg-teal-hover focus-visible:ring-teal/50"
        >
          Got it
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          fullWidth
          className="py-3 underline text-teal"
        >
          Skip onboarding
        </Button>
      </div>
    </div>
  );
}

function LocationStep({
  onEnableLocation,
  onManualEntry,
}: {
  onEnableLocation: () => void;
  onManualEntry: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center pt-8">
      <LocationIcon />

      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        Everything nearby,
      </h1>
      <h1 className="text-2xl font-bold text-neutral-900 mb-4">
        curated for you
      </h1>

      <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
        Your location is only used when Novi is open.
        <br />
        We never track you in the background or share
        <br />
        your data.
      </p>

      <Card
        variant="default"
        padding="md"
        className="w-full space-y-3 mb-8 rounded-3xl border-none shadow-none bg-rose-light"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <svg className="w-4 h-4 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-rose">
            Location only when app is open
          </p>
        </div>
        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <svg className="w-4 h-4 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-rose">
              Your privacy is protected
            </p>
            <p className="text-xs text-neutral-500">
              We never share your location with third parties
            </p>
          </div>
        </div>
      </Card>

      <div className="w-full space-y-3">
        <Button
          onClick={onEnableLocation}
          fullWidth
          size="lg"
          className="h-14 rounded-2xl bg-teal hover:bg-teal-hover active:bg-teal-hover focus-visible:ring-teal/50"
        >
          Enable location
        </Button>
        <Button
          onClick={onManualEntry}
          variant="ghost"
          fullWidth
          size="lg"
          className="h-14 rounded-2xl border-2 text-teal border-teal bg-white hover:bg-teal-light active:bg-teal-light"
        >
          Enter Manually
        </Button>
      </div>
    </div>
  );
}

function PreferencesStep({
  selectedDietary,
  onDietaryToggle,
  diningBudget,
  onDiningBudgetChange,
  selectedActivities,
  onActivityToggle,
  activityBudget,
  onActivityBudgetChange,
}: {
  selectedDietary: string[];
  onDietaryToggle: (id: string) => void;
  diningBudget: number;
  onDiningBudgetChange: (val: number) => void;
  selectedActivities: string[];
  onActivityToggle: (id: string) => void;
  activityBudget: number;
  onActivityBudgetChange: (val: number) => void;
}) {
  return (
    <div className="pt-4">
      <h1 className="text-xl font-bold text-neutral-900 mb-1">
        The more you share, the
      </h1>
      <h1 className="text-xl font-bold text-neutral-900 mb-6">
        less you'll have to decide
      </h1>

      <div className="mb-6" role="group" aria-labelledby="dietary-label">
        <p id="dietary-label" className="text-sm font-semibold text-neutral-800 mb-3">
          Dietary Restrictions <span className="text-error" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((option) => (
            <Pill
              key={option.id}
              label={option.label}
              selected={selectedDietary.includes(option.id)}
              onClick={() => onDietaryToggle(option.id)}
            />
          ))}
        </div>
      </div>

      <BudgetSlider
        label="Dining Budget"
        value={diningBudget}
        onChange={onDiningBudgetChange}
      />

      <div className="mb-6" role="group" aria-labelledby="activity-label">
        <p id="activity-label" className="text-sm font-semibold text-neutral-800 mb-3">
          Activity Preference <span className="text-error" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {activityOptions.map((option) => (
            <Pill
              key={option.id}
              label={option.label}
              selected={selectedActivities.includes(option.id)}
              onClick={() => onActivityToggle(option.id)}
            />
          ))}
        </div>
      </div>

      <BudgetSlider
        label="Activity Budget"
        value={activityBudget}
        onChange={onActivityBudgetChange}
      />
    </div>
  );
}

function VibeStep({
  selectedVibes,
  onVibeToggle,
}: {
  selectedVibes: string[];
  onVibeToggle: (id: string) => void;
}) {
  return (
    <div className="pt-4">
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        What's your vibe?
      </h1>
      <p className="text-sm text-neutral-500 mb-6">
        Select the atmospheres you prefer{" "}
        <span className="text-error" aria-hidden="true">*</span>
        <span className="sr-only">(required)</span>
      </p>

      <div className="space-y-3" role="group" aria-label="Vibe selection">
        {vibeOptions.map((option) => (
          <SelectionCard
            key={option.id}
            emoji={option.emoji}
            title={option.title}
            description={option.description}
            selected={selectedVibes.includes(option.id)}
            onClick={() => onVibeToggle(option.id)}
            multiSelect={true}
          />
        ))}
      </div>
    </div>
  );
}

function TravelStyleStep({
  selectedTravelStyle,
  onTravelStyleSelect,
  error,
}: {
  selectedTravelStyle: string;
  onTravelStyleSelect: (id: string) => void;
  error: string | null;
}) {
  return (
    <div className="pt-4">
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        Your travel style
      </h1>
      <p className="text-sm text-neutral-500 mb-6">
        How do you like to explore?{" "}
        <span className="text-error" aria-hidden="true">*</span>
        <span className="sr-only">(required)</span>
      </p>

      <div className="space-y-3" role="radiogroup" aria-label="Travel style selection">
        {travelStyleOptions.map((option) => (
          <SelectionCard
            key={option.id}
            emoji={option.emoji}
            title={option.title}
            description={option.description}
            selected={selectedTravelStyle === option.id}
            onClick={() => onTravelStyleSelect(option.id)}
            multiSelect={false}
          />
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN ONBOARDING PAGE COMPONENT
// =============================================================================

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [diningBudget, setDiningBudget] = useState(1);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [activityBudget, setActivityBudget] = useState(1);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedTravelStyle, setSelectedTravelStyle] = useState<string>("");

  // FIX: totalSteps derived from the steps array length to stay in sync automatically.
  // Defined after the steps array below — see STEP_COUNT_ANCHOR.
  const TOTAL_STEPS = 5;

  // Validation per step
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 2: // Preferences step
        return selectedDietary.length > 0 && selectedActivities.length > 0;
      case 3: // Vibe step
        return selectedVibes.length > 0;
      case 4: // Travel style step
        return selectedTravelStyle !== "";
      default:
        return true;
    }
  }, [currentStep, selectedDietary, selectedActivities, selectedVibes, selectedTravelStyle]);

  const handleDietaryToggle = useCallback((id: string) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleActivityToggle = useCallback((id: string) => {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleVibeToggle = useCallback((id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleNext = useCallback(async () => {
    // Clear any previous error when navigating
    setError(null);

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Submit to API on the final step
      setIsLoading(true);

      const preferences = {
        dietary: selectedDietary,
        budget: budgetLabels[diningBudget],
        activities: selectedActivities,
        activityBudget: budgetLabels[activityBudget],
        vibes: selectedVibes,
        travelStyle: selectedTravelStyle,
      };

      try {
        const response = await api.onboardUser(preferences);

        // Save locally — wrapped in try/catch for private browsing mode (SecurityError)
        try {
          localStorage.setItem("noviPreferences", JSON.stringify(preferences));
          localStorage.setItem("noviOnboardingComplete", "true");
          if (response.user_id) {
            localStorage.setItem("noviUserId", response.user_id);
          }
        } catch (storageErr) {
          console.warn("localStorage unavailable:", storageErr);
        }

        router.push("/");
      } catch (err) {
        console.error("Onboarding error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        // FIX: Always reset loading state — handles slow router.push() and error cases
        setIsLoading(false);
      }
    }
  }, [
    currentStep,
    selectedDietary,
    diningBudget,
    selectedActivities,
    activityBudget,
    selectedVibes,
    selectedTravelStyle,
    router,
  ]);

  // FIX: Use setCurrentStep with functional updater directly instead of calling handleNext.
  // This eliminates the stale closure / race condition risk if geolocation resolves late.
  const handleEnableLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            localStorage.setItem(
              "noviLocation",
              JSON.stringify({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              })
            );
          } catch (storageErr) {
            console.warn("localStorage unavailable:", storageErr);
          }
          // FIX: Functional updater avoids stale closure if GPS resolves after user navigated
          setCurrentStep((prev) => prev + 1);
        },
        () => {
          // Permission denied or error — still proceed
          setCurrentStep((prev) => prev + 1);
        }
      );
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, []);

  const handleSkipOnboarding = useCallback(() => {
    try {
      localStorage.setItem("noviOnboardingComplete", "true");
    } catch (storageErr) {
      console.warn("localStorage unavailable:", storageErr);
    }
    router.push("/");
  }, [router]);

  // Step components — memoized to avoid recreation on every render
  // STEP_COUNT_ANCHOR: if you add/remove a step here, update TOTAL_STEPS above to match
  const steps = useMemo(
    () => [
      <HowItWorksStep key="how-it-works" onNext={handleNext} onSkip={handleSkipOnboarding} />,
      <LocationStep key="location" onEnableLocation={handleEnableLocation} onManualEntry={() => setCurrentStep((prev) => prev + 1)} />,
      <PreferencesStep
        key="preferences"
        selectedDietary={selectedDietary}
        onDietaryToggle={handleDietaryToggle}
        diningBudget={diningBudget}
        onDiningBudgetChange={setDiningBudget}
        selectedActivities={selectedActivities}
        onActivityToggle={handleActivityToggle}
        activityBudget={activityBudget}
        onActivityBudgetChange={setActivityBudget}
      />,
      <VibeStep key="vibe" selectedVibes={selectedVibes} onVibeToggle={handleVibeToggle} />,
      <TravelStyleStep
        key="travel-style"
        selectedTravelStyle={selectedTravelStyle}
        onTravelStyleSelect={setSelectedTravelStyle}
        error={error}
      />,
    ],
    [
      handleNext,
      handleSkipOnboarding,
      handleEnableLocation,
      selectedDietary,
      handleDietaryToggle,
      diningBudget,
      selectedActivities,
      handleActivityToggle,
      activityBudget,
      selectedVibes,
      handleVibeToggle,
      selectedTravelStyle,
      error,
    ]
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Progress Indicator */}
        <ProgressDots current={currentStep} total={TOTAL_STEPS} />

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 px-6 pb-40"
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation — visible from Preferences step onward */}
        {currentStep >= 2 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 safe-area-pb">
            <div className="max-w-md mx-auto p-5 space-y-3">
              <Button
                onClick={handleNext}
                disabled={!isStepValid || isLoading}
                loading={isLoading}
                fullWidth
                size="lg"
                className={`h-14 rounded-2xl ${
                  !isStepValid || isLoading
                    ? "!bg-neutral-400 !active:bg-neutral-400" 
                    : "!bg-teal !hover:bg-teal-hover !active:bg-teal-hover !focus-visible:ring-teal/50"
                }`}
              >
                {isLoading
                  ? "Setting up..."
                  : currentStep === TOTAL_STEPS - 1
                  ? "Get Started"
                  : "Continue"}
              </Button>
              {currentStep < TOTAL_STEPS - 1 && (
                <Button
                  onClick={handleSkipOnboarding}
                  variant="ghost"
                  fullWidth
                  className="py-2 underline text-teal"
                >
                  Skip
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}