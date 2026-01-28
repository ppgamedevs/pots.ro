export const SUPPORT_TIMEZONE = "Europe/Bucharest";
export const SUPPORT_HOURS_LABEL = "09:00–18:00";
export const SUPPORT_START_HOUR = 9;
export const SUPPORT_END_HOUR = 18;

export function getRomaniaTimeParts(now: Date = new Date()): { hour: number; minute: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SUPPORT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const wd = (parts.find((p) => p.type === "weekday")?.value ?? "Mon").toLowerCase();

  // Map: Mon..Sun -> 1..7
  const weekdayMap: Record<string, number> = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 7,
  };

  return { hour, minute, weekday: weekdayMap[wd] ?? 1 };
}

export function isWithinSupportHoursRo(now: Date = new Date()): boolean {
  const { hour, minute } = getRomaniaTimeParts(now);
  const afterStart = hour > SUPPORT_START_HOUR || (hour === SUPPORT_START_HOUR && minute >= 0);
  // End-exclusive: 18:00 is considered outside hours.
  const beforeEnd = hour < SUPPORT_END_HOUR;
  return afterStart && beforeEnd;
}

export function getOutsideHoursNoticeRo(): string {
  return `Suntem în afara orelor de program (${SUPPORT_HOURS_LABEL}). Lasă-ne mesajul aici — îl vedem și îți răspundem cât mai curând posibil.`;
}
