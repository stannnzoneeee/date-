export function localDateString(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

// The default 10 AM start runs until 5 PM.
export const DATE_HOURS = 7;

export type DateChoice = { value: string; day: string; label: string };

export function upcomingWeekend(now = new Date()): DateChoice[] {
  const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7 || 7));
  const sunday = new Date(saturday);
  sunday.setDate(sunday.getDate() + 1);
  return [saturday, sunday].map((date) => ({
    value: localDateString(date),
    day: date.toLocaleDateString("en-US", { weekday: "long" }),
    label: date.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
  }));
}

export function buildCalendarUrl(date: string, time: string, location: string, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;

  // Parse in the visitor's local timezone, then send unambiguous UTC times to Google.
  const start = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(start.getTime()) || start <= now) return null;
  if (localDateString(start) !== date || `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}` !== time) return null;

  const end = new Date(start.getTime() + DATE_HOURS * 60 * 60 * 1000);
  const timestamp = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "It's a date! 💕",
    dates: `${timestamp(start)}/${timestamp(end)}`,
    details: "You said yes! One little date and a very big smile. Can't wait to spend some time with you. 💌",
  });
  if (location.trim()) params.set("location", location.trim());
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
