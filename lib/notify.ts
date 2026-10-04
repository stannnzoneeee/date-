export const NOTIFY_EMAIL = "stanly16tomas@gmail.com";

export type DatePlan = { date: string; time: string; place: string };

// FormSubmit emails the plan to NOTIFY_EMAIL. Its very first submission only sends an activation email.
export function notifyDatePicked(plan: DatePlan) {
  fetch(`https://formsubmit.co/ajax/${NOTIFY_EMAIL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ _subject: "She picked a date! 💌", _template: "table", _captcha: "false", ...plan }),
    keepalive: true,
  }).catch(() => {});
}
