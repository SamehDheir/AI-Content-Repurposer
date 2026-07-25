"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/src/hooks/useSession";
import { SiteHeader } from "@/src/components/home/SiteHeader";
import { Hero } from "@/src/components/home/Hero";
import { Ticker } from "@/src/components/home/Ticker";
import { Outputs } from "@/src/components/home/Outputs";
import { Pipeline } from "@/src/components/home/Pipeline";
import { Specs } from "@/src/components/home/Specs";
import { Rates } from "@/src/components/home/Rates";
import { Colophon } from "@/src/components/home/Colophon";

export default function Home() {
  const router = useRouter();
  const { authed } = useSession();

  // Signed in, you land on the desk; otherwise at the door. Either way any URL
  // typed on this page has already been parked for the composer to pick up.
  const enter = useCallback(() => {
    router.push(authed ? "/dashboard" : "/login");
  }, [authed, router]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader authed={authed} onEnter={enter} />
      <main>
        <Hero authed={authed} onEnter={enter} />
        <Ticker />
        <Outputs />
        <Pipeline />
        <Specs />
        <Rates onEnter={enter} />
        <Colophon authed={authed} onEnter={enter} />
      </main>
    </div>
  );
}
