# A little question for you 💌

A single-page Next.js date invitation, styled as a cream postcard with an airmail border. The entire experience lives at `/`.

- Matches the supplied design: Gloock and Nunito Sans typography, a tilted postage stamp, date cards, and a dashed confirmation note.
- Nine locally served bear GIFs, including the original four and five additional reactions from the design reference.
- A different opening GIF on phones. **No** changes the reaction and moves inside the visible postcard; desktop hover also makes it dodge after the first click. Keyboard activation works, and reduced motion keeps the button still.
- **Yes!!!** reveals date cards for the upcoming Saturday and Sunday, plus a visible **Choose your own date** option. Choosing that third card opens a date picker for her preferred day and remembers it when switching between options. A collapsible section lets you change the time or location.
- **Add to Google Calendar** opens a prefilled seven-hour event (10 AM to 5 PM by default) using the chosen date, local time, and optional location. The visitor reviews it and presses **Save** in Google Calendar. The event lists the address in `lib/notify.ts` as a guest, and tapping the button also emails that address the chosen plan through [FormSubmit](https://formsubmit.co). The first FormSubmit email is an activation link, so send yourself a test date once before sharing the page.
- GIFs and fonts are served locally. Reduced-motion preferences use still images.
- No WhatsApp, Firebase, accounts, admin dashboard, analytics, or page builder.

## Run locally

Use Node.js 22:

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

Import this repository into Vercel and deploy. `vercel.json` specifies the **Next.js** framework, `npm ci`, `npm run build`, and the `.next` output directory. No environment variables or database are required. For an existing Vercel project, remove any old static-site build overrides and use the repository root as the Root Directory.

Only `/` is an application page. Old `/landing`, `/create`, `/manage`, `/admin`, `/date`, their `.html` versions, `/index.html`, and `/d-...` links redirect to `/`. Old API endpoints and unrelated paths return 404. This project is configured for deployment; running the local build does not publish it.

## Customize

- Invitation text and interactions: `components/date-invitation.tsx`.
- GIF reactions, captions, and No button labels: `lib/reactions.ts`.
- Event title, description, and seven-hour duration: `lib/calendar.ts`.
- Colors, typography, and responsive layout: `app/globals.css`.
- Animated and still assets: `public/gifs/`.

The two suggested days are the upcoming weekend, with a default time of 10 AM to 5 PM in the visitor's timezone. Choose a day before the calendar button becomes available. The submitted date and time are converted to UTC for Google Calendar, including timezone offsets and daylight-saving changes. The confirmation summarizes the chosen plan and reminds the visitor to press Save in Google Calendar; it does not claim that the event was automatically saved.

## Check the build

```bash
npm run build
npm run typecheck
npx playwright install chromium webkit
npm test
```

The browser tests cover desktop and phone interactions, calendar details, time validation, reduced motion, asset failures, and removal of the old routes. `npm test` runs against a production build, so build first.

Framework setup follows the [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation). See [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md) for media sources and font licenses.
