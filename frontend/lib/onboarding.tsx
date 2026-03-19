import type { SVGProps } from "react";

export const LS_USER_ID = "novi_user_id";
export const LS_USER_NAME = "novi_user_name";
export const LS_ACTIVITY = "novi_onboarding_activity";
export const LS_DIETARY = "novi_onboarding_dietary";
export const LS_BUDGET = "novi_onboarding_budget";

export interface OnboardingData {
  name: string;
  dietary: string[];
  budget: number;
  activity: string[];
}

export const ACTIVITY = [
  { value: "food", label: "Food", description: "From street eats to sit-down spots", icon: IconFood },
  { value: "social", label: "Social", description: "Bars, people, and late nights", icon: IconGlass },
  { value: "explore", label: "Explore", description: "Hidden corners and open streets", icon:IconMap },
];

export const DIETARY = [
  { value: "none", label: "No preference", icon: IconFork },
  { value: "vegetarian", label: "Vegetarian", icon: IconCarrot },
  { value: "vegan", label: "Vegan", icon: IconLeaf },
  { value: "gluten-free", label: "Gluten-free", icon: IconWheat },
  { value: "halal", label: "Halal", icon: IconIslam },
];

export const BUDGET = [
  { value: 1, symbol: "¥", label: "I keep it budget-friendly" },
  { value: 2, symbol: "¥¥", label: "I balance both" },
  { value: 3, symbol: "¥¥¥", label: "I like the finer things" },
];

export function IconFork(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...props}>
      <path fill="currentColor" d="M72 88V40a8 8 0 0 1 16 0v48a8 8 0 0 1-16 0m144-48v184a8 8 0 0 1-16 0v-48h-48a8 8 0 0 1-8-8a268.8 268.8 0 0 1 7.22-56.88c9.78-40.49 28.32-67.63 53.63-78.47A8 8 0 0 1 216 40m-16 13.9c-32.17 24.57-38.47 84.42-39.7 106.1H200Zm-80.11-15.21a8 8 0 1 0-15.78 2.63L112 88.63a32 32 0 0 1-64 0l7.88-47.31a8 8 0 1 0-15.78-2.63l-8 48A8 8 0 0 0 32 88a48.07 48.07 0 0 0 40 47.32V224a8 8 0 0 0 16 0v-88.68A48.07 48.07 0 0 0 128 88a8 8 0 0 0-.11-1.31Z" />
    </svg>
  );
}

export function IconCarrot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...props}>
      <path fill="currentColor" d="M232 64h-28.69l26.35-26.34a8 8 0 0 0-11.32-11.32L192 52.69V24a8 8 0 0 0-16 0v32.57a64 64 0 0 0-77.2 10.12c-40.1 39.39-70.25 133.08-73.19 142.45a16 16 0 0 0 21.26 21.26c9.37-2.94 103.18-33.13 142.47-73.21A64 64 0 0 0 199.43 80H232a8 8 0 0 0 0-16m-54.12 82c-8.94 9.12-21.25 17.8-34.85 25.73l-25.38-25.39a8 8 0 0 0-11.32 11.32l22.09 22.09c-40.87 21.19-86.32 35.42-87 35.63A8 8 0 0 0 40 216a8 8 0 0 0 .59-1.41c.29-.93 28-89.58 64-130.67l33.77 33.77a8 8 0 0 0 11.32-11.32l-33.5-33.49a48 48 0 0 1 61.7 73.12" />
    </svg>
  );
}

export function IconLeaf(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...props}>
      <path fill="currentColor" d="M247.63 47.89a8 8 0 0 0-7.52-7.52c-51.76-3-93.32 12.74-111.18 42.22c-11.8 19.49-11.78 43.16-.16 65.74a71.3 71.3 0 0 0-14.17 27L98.33 159c7.82-16.33 7.52-33.35-1-47.49c-13.2-21.79-43.67-33.47-81.5-31.25a8 8 0 0 0-7.52 7.52c-2.23 37.83 9.46 68.3 31.25 81.5A45.8 45.8 0 0 0 63.44 176A54.6 54.6 0 0 0 87 170.33l25 25V224a8 8 0 0 0 16 0v-29.49a55.6 55.6 0 0 1 12.27-35a73.9 73.9 0 0 0 33.31 8.4a60.9 60.9 0 0 0 31.83-8.86c29.48-17.84 45.26-59.4 42.22-111.16M47.81 155.6C32.47 146.31 23.79 124.32 24 96c28.32-.24 50.31 8.47 59.6 23.81c4.85 8 5.64 17.33 2.46 26.94l-24.41-24.41a8 8 0 0 0-11.31 11.31l24.41 24.41c-9.61 3.18-18.93 2.39-26.94-2.46m149.31-10.22c-13.4 8.11-29.15 8.73-45.15 2l53.69-53.7a8 8 0 0 0-11.31-11.31L140.65 136c-6.76-16-6.15-31.76 2-45.15c13.94-23 47-35.82 89.33-34.83c.96 42.32-11.84 75.42-34.86 89.36" />
    </svg>
  );
}

export function IconWheat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <path d="m2 22l10-10m4-4l-1.17 1.17M3.47 12.53L5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94M8 8l-.53.53a3.5 3.5 0 0 0 0 4.94L9 15l1.53-1.53c.55-.55.88-1.25.98-1.97m-.6-6.24c.15-.26.34-.51.56-.73L13 3l1.53 1.53a3.5 3.5 0 0 1 .28 4.62M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4" />
        <path d="M11.47 17.47L13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0M16 16l-.53.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 1.97-.98m6.24.6c.26-.15.51-.34.73-.56L21 11l-1.53-1.53a3.5 3.5 0 0 0-4.62-.28M2 2l20 20" />
      </g>
    </svg>
  );
}

export function IconIslam(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}>
        <path d="M5.21 7a5.5 5.5 0 0 1 5.47-5.5a6.5 6.5 0 1 0 0 11A5.5 5.5 0 0 1 5.21 7" />
        <path d="m10.57 4.04l.91 1.81h1.81l-1.36 1.4l.43 2l-1.79-1l-1.71 1l.36-2l-1.36-1.4h1.81z" />
      </g>
    </svg>
  );
}

export function IconFood(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.25 2.75v7a3 3 0 0 0 3 3h1m4-10v7a3 3 0 0 1-3 3h-1m0-10v10m0 0v8.5m13.5 0v-6.5m0 0V3.286a.536.536 0 0 0-.536-.536a4.464 4.464 0 0 0-4.464 4.464v5.536a2 2 0 0 0 2 2z"></path>
    </svg>
  );
}

export function IconGlass(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14c2.761 0 5-2.668 5-5.43c0-1.385-1.12-4.507-1.5-5.57h-7C8.152 4.021 7 7.172 7 8.57C7 11.333 9.239 14 12 14m0 0v7m0 0H9m3 0h3M7 9h9"></path>
    </svg>
  );
}

export function IconMap(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="m15 21l-6-2.1l-4.65 1.8q-.5.2-.925-.112T3 19.75v-14q0-.325.188-.575T3.7 4.8L9 3l6 2.1l4.65-1.8q.5-.2.925.113T21 4.25v14q0 .325-.187.575t-.513.375zm-1-2.45V6.85l-4-1.4v11.7zm2 0l3-1V5.7l-3 1.15zM5 18.3l3-1.15V5.45l-3 1zM16 6.85v11.7zm-8-1.4v11.7z"></path>
    </svg>
  );
}
