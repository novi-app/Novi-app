export function formatWalkTime(distance_km: number): string {
  const mins = Math.max(1, Math.round((distance_km / 5) * 60));
  if (mins < 60) return `${mins} min walk`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  return remainder === 0 ? `${hours}h walk` : `${hours}h ${remainder}min walk`;
}
