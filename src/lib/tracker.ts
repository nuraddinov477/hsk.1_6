"use client";

// Tracks "I'm using the app right now" sessions + activity events.
// One session per app-shell mount: start on mount, heartbeat every 30s,
// end on tab close / pagehide. Fully best-effort — every call swallows
// errors so a flaky network never blocks the UI.

const SESSION_ID_KEY = "hskgo.sessionId";

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let endedHookInstalled = false;

function postJSON(url: string, method: string, body?: unknown) {
  if (typeof window === "undefined") return Promise.resolve();
  return fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    keepalive: true, // lets us hit /api on pagehide
  }).catch(() => undefined);
}

function getSessionId(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_ID_KEY);
  } catch {
    return null;
  }
}

function setSessionId(id: string | null) {
  try {
    if (id) window.sessionStorage.setItem(SESSION_ID_KEY, id);
    else window.sessionStorage.removeItem(SESSION_ID_KEY);
  } catch {
    /* ignore */
  }
}

/** Start (or resume) a session and begin heartbeats. Safe to call repeatedly. */
export async function startSession() {
  if (typeof window === "undefined") return;

  // Reuse the in-tab session if there is one — keeps "minutes on platform"
  // additive across SPA navigations without inflating the session count.
  let id = getSessionId();
  if (!id) {
    const r = await fetch("/api/track/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAgent: navigator.userAgent.slice(0, 200) }),
    }).catch(() => null);
    if (!r || !r.ok) return; // not signed in / offline — silently skip
    const j = (await r.json().catch(() => null)) as { id?: string } | null;
    if (!j?.id) return;
    id = j.id;
    setSessionId(id);
  }

  if (!heartbeatTimer) {
    heartbeatTimer = setInterval(() => void heartbeat(), 30_000);
  }
  if (!endedHookInstalled) {
    endedHookInstalled = true;
    window.addEventListener("pagehide", endSession);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void heartbeat();
    });
  }
}

async function heartbeat() {
  const id = getSessionId();
  if (!id) return;
  await postJSON("/api/track/session", "PUT", { id });
}

export function endSession() {
  const id = getSessionId();
  if (!id) return;
  // navigator.sendBeacon survives the unload — fall back to keepalive fetch.
  const url = "/api/track/session";
  const blob = new Blob([JSON.stringify({ id, end: true })], { type: "application/json" });
  const sent = typeof navigator !== "undefined" && navigator.sendBeacon?.(url, blob);
  if (!sent) void postJSON(url, "DELETE", { id });
  setSessionId(null);
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/** Log a single activity event. Fire-and-forget. */
export function trackEvent(type: string, payload?: Record<string, unknown>) {
  void postJSON("/api/track/event", "POST", { type, payload });
}
