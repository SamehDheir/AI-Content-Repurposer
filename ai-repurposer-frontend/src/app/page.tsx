"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { SiteHeader } from "@/components/home/SiteHeader";
import { Hero } from "@/components/home/Hero";
import { Ticker } from "@/components/home/Ticker";
import { Outputs } from "@/components/home/Outputs";
import { Pipeline } from "@/components/home/Pipeline";
import { Specs } from "@/components/home/Specs";
import { Rates } from "@/components/home/Rates";
import { Colophon } from "@/components/home/Colophon";

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
