"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Are we signed in? The auth cookies are HttpOnly and unreadable from
 * JavaScript, so the only way to know is to ask the API. Several components on
 * the marketing page want the answer, so the in-flight probe is shared.
 *
 * `probeSession` rather than `getMe`: a 401 here means signed out, and chasing
 * it with a refresh cost anonymous visitors a second round-trip for an answer
 * the first one had already given.
 */
let probe: Promise<boolean> | null = null;

function checkSession(): Promise<boolean> {
  probe ??= api
    .probeSession()
    .then(() => true)
    .catch(() => false);
  return probe;
}

export function useSession() {
  const [state, setState] = useState<{ authed: boolean; ready: boolean }>({
    authed: false,
    ready: false,
  });

  useEffect(() => {
    let live = true;
    checkSession().then((authed) => live && setState({ authed, ready: true }));
    return () => {
      live = false;
    };
  }, []);

  return state;
}
