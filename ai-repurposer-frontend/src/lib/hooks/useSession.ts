"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Are we signed in? The auth cookies are HttpOnly and unreadable from
 * JavaScript, so the only way to know is to ask the API. Several components on
 * the marketing page want the answer, so the in-flight probe is shared.
 */
let probe: Promise<boolean> | null = null;

function checkSession(): Promise<boolean> {
  probe ??= api
    .getMe()
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
