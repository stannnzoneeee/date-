"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { DATE_HOURS, buildCalendarUrl, localDateString, upcomingWeekend, type DateChoice } from "@/lib/calendar";
import { notifyDatePicked } from "@/lib/notify";
import { reactions } from "@/lib/reactions";

function ReactionGif({ accepted, noCount }: { accepted: boolean; noCount: number }) {
  const [failedGif, setFailedGif] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const reaction = noCount ? reactions[(noCount - 1) % reactions.length] : null;
  const gif = accepted ? "celebrating" : reaction?.gif ?? "waiting";
  const alt = accepted ? "Two happy bears celebrating with dessert" : reaction?.alt ?? "A cute bear nervously waiting for an answer";

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setFailedGif(gif);
  }, [gif]);

  return (
    <figure className={`gif-stamp${accepted ? " gif-stamp--accepted" : ""}`} style={{ "--stamp-rotation": accepted ? "2deg" : noCount % 2 ? "3deg" : "-2.5deg" } as CSSProperties}>
      <div className="gif-window">
        {failedGif === gif ? <div className="gif-fallback" role="img" aria-label={alt}><span aria-hidden="true">{accepted ? "🐻💕🐻‍❄️" : noCount ? "🥺💌" : "🐻💌"}</span></div> : (
          <picture>
            <source media="(prefers-reduced-motion: reduce) and (max-width: 600px)" srcSet={`/gifs/${!accepted && !noCount ? "shy" : gif}.png`} />
            <source media="(prefers-reduced-motion: reduce)" srcSet={`/gifs/${gif}.png`} />
            {!accepted && !noCount && <source media="(max-width: 600px)" srcSet="/gifs/shy.gif" />}
            {/* These bundled animated GIFs do not need image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imageRef} src={`/gifs/${gif}.gif`} alt={alt} width={320} height={210} fetchPriority="high" onError={() => setFailedGif(gif)} />
          </picture>
        )}
      </div>
      <figcaption className="sr-only">{alt}</figcaption>
    </figure>
  );
}

function CalendarIcon() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" /><path d="M7.5 3v4M16.5 3v4M4 10h16M8 14h3M8 17h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

export default function DateInvitation() {
  const [accepted, setAccepted] = useState(false);
  const [noCount, setNoCount] = useState(0);
  const [noPosition, setNoPosition] = useState<{ left: number; top: number } | null>(null);
  const [boundsVersion, setBoundsVersion] = useState(0);
  const [dateOptions, setDateOptions] = useState<DateChoice[]>([]);
  const [date, setDate] = useState("");
  const [customDate, setCustomDate] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const noRef = useRef<HTMLButtonElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const lastDodge = useRef(0);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const reaction = noCount ? reactions[(noCount - 1) % reactions.length] : null;

  useEffect(() => {
    if (accepted) headingRef.current?.focus({ preventScroll: true });
  }, [accepted]);

  useEffect(() => {
    if (calendarUrl) confirmationRef.current?.focus({ preventScroll: true });
  }, [calendarUrl]);

  useEffect(() => {
    const updateBounds = () => setBoundsVersion((version) => version + 1);
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  useLayoutEffect(() => {
    if (!noCount || accepted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = cardRef.current, no = noRef.current, yes = yesRef.current;
    if (!card || !no || !yes) return;
    const bounds = card.getBoundingClientRect();
    const yesBounds = yes.getBoundingClientRect();
    const width = no.offsetWidth, height = no.offsetHeight, inset = 12;
    const maxX = Math.max(inset, bounds.width - width - inset);
    const minY = Math.max(inset, -bounds.top + inset);
    const maxY = Math.max(minY, Math.min(bounds.height - height - inset, window.innerHeight - bounds.top - height - inset));
    let best = { left: maxX, top: minY };
    let bestDistance = -1;
    // Keep the joke inside the visible card and leave Yes unobstructed.
    for (let attempt = 0; attempt < 40; attempt++) {
      const left = inset + Math.random() * Math.max(0, maxX - inset);
      const top = minY + Math.random() * Math.max(0, maxY - minY);
      const x = bounds.left + left, y = bounds.top + top;
      if (x < yesBounds.right + 18 && x + width > yesBounds.left - 18 && y < yesBounds.bottom + 18 && y + height > yesBounds.top - 18) continue;
      const pointer = lastPointer.current;
      const distance = pointer ? Math.hypot(x + width / 2 - pointer.x, y + height / 2 - pointer.y) : Math.hypot(left - (noPosition?.left ?? 0), top - (noPosition?.top ?? 0));
      if (distance > bestDistance) { best = { left, top }; bestDistance = distance; }
      if (distance > 180) break;
    }
    if (bestDistance >= 0) setNoPosition(best);
    // Reposition only after a reaction; position updates must not trigger another dodge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noCount, accepted, boundsVersion]);

  function sayNo(x?: number, y?: number) {
    lastDodge.current = performance.now();
    lastPointer.current = x !== undefined && y !== undefined ? { x, y } : null;
    setNoCount((count) => count + 1);
  }

  function sayYes() {
    setDateOptions(upcomingWeekend());
    setNoPosition(null);
    setError("");
    setAccepted(true);
  }

  function openCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = buildCalendarUrl(date, time, location);
    if (!url) { setError("Pick a future date and time — our time machine is still in the shop."); return; }
    setError("");
    window.open(url, "_blank", "noopener,noreferrer");
    notifyDatePicked({ date: chosenDate, time: chosenTime, place: location.trim() || "Just us two" });
    setCalendarUrl(url);
  }

  function goBack() {
    setAccepted(false);
    setNoCount(0);
    setNoPosition(null);
    setCalendarUrl(null);
    setError("");
    requestAnimationFrame(() => yesRef.current?.focus({ preventScroll: true }));
  }

  const chosenDate = date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "";
  const timeLabel = (value: Date) => value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const startTime = new Date(`2000-01-01T${time}:00`);
  const chosenTime = time ? `${timeLabel(startTime)} – ${timeLabel(new Date(startTime.getTime() + DATE_HOURS * 60 * 60 * 1000))}` : "";

  return (
    <main className="page">
      <article className={`postcard${accepted ? " postcard--accepted" : ""}`} aria-labelledby="date-question">
        <div className="postcard-paper" ref={cardRef}>
          <header className="postcard-header">
            <p className="eyebrow">{accepted ? "IT’S A DATE" : "A LITTLE QUESTION FOR YOU"}</p>
            <div className="postmark" aria-label="Sent with love"><span>SENT</span><span className="postmark-heart" aria-hidden="true">♥</span><span>WITH LOVE</span></div>
          </header>

          <ReactionGif accepted={accepted} noCount={noCount} />
          <h1 id="date-question" ref={headingRef} tabIndex={-1}>{accepted ? "Yayyyyyyyy!!! Finally" : <>Will you go on<br />a date with me?</>}</h1>

          {accepted ? (
            <div className="celebration">
              <form className="calendar-form" onSubmit={openCalendar} noValidate>
                <fieldset className={`date-choices${calendarUrl ? " date-choices--confirmed" : ""}`} disabled={!!calendarUrl}>
                  <legend>Pick our date</legend>
                  <div className="date-options">
                    {dateOptions.map((option) => <label className="date-option" key={option.value}>
                      <input type="radio" name="suggested-date" value={option.value} checked={!customDate && date === option.value} onChange={() => { setCustomDate(false); setDate(option.value); setError(""); }} />
                      <span className="date-option-paper"><span className="date-option-day">{option.day}</span><span className="date-option-date">{option.label}</span></span>
                    </label>)}
                    <label className="date-option date-option--custom">
                      <input type="radio" name="suggested-date" value="custom" checked={customDate} onChange={() => { setCustomDate(true); setDate(preferredDate); setError(""); }} aria-controls="preferred-date-picker" />
                      <span className="date-option-paper"><span className="date-option-day">Whatever works for you</span><span className="date-option-date">Choose your own date</span></span>
                    </label>
                  </div>
                  {customDate && !calendarUrl && <div className="preferred-date custom-plan" id="preferred-date-picker">
                    <label>Your preferred date<input type="date" name="preferred-date" value={preferredDate} min={localDateString(new Date())} onChange={(event) => { setPreferredDate(event.target.value); setDate(event.target.value); setError(""); }} aria-describedby="preferred-date-hint" /></label>
                    <p id="preferred-date-hint">Pick a day that makes you smile. I’m free for you. ♡</p>
                  </div>}
                </fieldset>

                {calendarUrl ? (
                  <div className="confirmation" ref={confirmationRef} tabIndex={-1} aria-label="Your chosen date">
                    <span className="eyebrow">IT’S A DATE!</span>
                    <strong>{chosenDate}</strong>
                    <span className="confirmation-details">{chosenTime}{location.trim() ? ` · ${location.trim()}` : " · just us two"}</span>
                    <p>Hit Save in Google Calendar.<br />See you there ♥</p>
                    <a href={calendarUrl} target="_blank" rel="noopener noreferrer">Open Google Calendar again ↗</a>
                  </div>
                ) : (
                  <>
                    <details className="plan-details">
                      <summary>Change the time or place? <span aria-hidden="true">⌄</span></summary>
                      <div className="custom-plan">
                        <label>Our time<input type="time" name="time" required value={time} onChange={(event) => { setTime(event.target.value); setError(""); }} /></label>
                        <label>Our spot <span className="optional">(optional)</span><input type="text" name="location" value={location} maxLength={200} placeholder="Coffee, dinner, a little adventure…" onChange={(event) => setLocation(event.target.value)} /></label>
                      </div>
                    </details>
                    {error && <p className="form-error" id="calendar-error" role="alert">{error}</p>}
                    <button className="button button-yes calendar-button" type="submit" disabled={!date || !time} aria-describedby={error ? "calendar-error calendar-hint" : "calendar-hint"}><CalendarIcon />Add to Google Calendar</button>
                    <p id="calendar-hint" className="calendar-hint">{date ? `${chosenTime} · your local time` : customDate ? "Choose your preferred date above. ♡" : "Pick a day first. I’ll bring the butterflies."}</p>
                    <p className="save-hint">Review the event in Google Calendar and hit Save.</p>
                  </>
                )}
              </form>
              {calendarUrl && <button type="button" className="text-button change-plan" onClick={() => setCalendarUrl(null)}>Change our little plan</button>}
              <button type="button" className="text-button back-button" onClick={goBack}>← Read my little note again</button>
            </div>
          ) : (
            <div className="answer-area">
              <div className="answer-buttons">
                <button ref={yesRef} className="button button-yes" style={{ "--yes-scale": Math.min(1 + noCount * .055, 1.22) } as CSSProperties} type="button" onClick={sayYes}>Yes!!!</button>
                <button ref={noRef} className={`button button-no${noCount ? " button-no--escaped" : ""}`} style={noPosition ?? undefined} type="button" onClick={(event) => sayNo(event.detail ? event.clientX : undefined, event.detail ? event.clientY : undefined)} onPointerEnter={(event) => {
                  if (event.pointerType === "mouse" && noCount > 0 && performance.now() - lastDodge.current > 650 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) sayNo(event.clientX, event.clientY);
                }}>{reaction?.button ?? "No"}</button>
              </div>
              <p className="reaction-hint" aria-live="polite" aria-atomic="true">{reaction ? reaction.caption : <><span className="desktop-caption">me, waiting very casually for your answer.</span><span className="mobile-caption">me after rehearsing this 47 times.</span></>}</p>
            </div>
          )}

          {accepted && <div className="heart-burst" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <span key={index} style={{ "--i": index, "--drift": `${((index * 37) % 130) - 65}px` } as CSSProperties}>♥</span>)}</div>}
        </div>
      </article>
    </main>
  );
}
