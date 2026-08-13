import type { Metadata } from "next";
import Link from "next/link";
import { SHARE_CAPTION } from "@/lib/tokens";

interface SharePageProps {
  searchParams: Promise<{
    n?: string;
    r?: string;
    b?: string;
    c?: string;
    p?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const name = params.n || "Anonymous Builder";
  const role = params.r || "Frontend";
  const builderNumber = params.b || "0001";
  const builderClass = params.c || "SHIP-WEAVER";
  const photoUrl = params.p;

  // Build OG image URL — includes all params so the OG card matches the user's pass
  const ogParams = new URLSearchParams({
    n: name,
    r: role,
    b: builderNumber,
    c: builderClass,
  });
  if (photoUrl) ogParams.set("p", photoUrl);

  const ogImageUrl = `/api/og?${ogParams.toString()}`;
  const title = `${name} — Hacker House Goa 2026 Builder Pass`;

  return {
    title,
    description: `${name} stamped their builder pass for Hacker House Goa 2026. ${SHARE_CAPTION}`,
    openGraph: {
      title,
      description: `${name} stamped their builder pass for Hacker House Goa 2026. #FrameInGoa`,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1080,
          height: 1350,
          alt: `${name}'s Hacker House Goa 2026 Builder Pass`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `${name} stamped their builder pass for Hacker House Goa 2026. #FrameInGoa`,
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const name = params.n || "Anonymous Builder";
  const role = params.r || "Frontend";
  const builderNumber = params.b || "0001";
  const builderClass = params.c || "SHIP-WEAVER";
  const photoUrl = params.p;

  const ogParams = new URLSearchParams({
    n: name,
    r: role,
    b: builderNumber,
    c: builderClass,
  });
  if (photoUrl) ogParams.set("p", photoUrl);
  const ogImageUrl = `/api/og?${ogParams.toString()}`;

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-4 lg:p-8">
      {/* Header */}
      <header className="w-full max-w-2xl mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hacker-house.png"
            alt="Hacker House logo"
            width={120}
            height={25}
            className="h-6 w-auto"
          />
          <span className="font-mono text-xs text-ink/40">GOA · 2026</span>
        </div>
        <span className="font-mono text-xs text-feni border border-feni px-2 py-1">
          #FrameInGoa
        </span>
      </header>

      {/* Card image (server-rendered OG image) */}
      <div className="w-full max-w-[480px] border-2 border-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ogImageUrl}
          alt={`${name}'s Hacker House Goa 2026 Builder Pass`}
          width={1080}
          height={1350}
          className="w-full h-auto block"
        />
      </div>

      {/* Builder details */}
      <div className="w-full max-w-[480px] mt-6 space-y-3">
        <div className="flex items-baseline justify-between border-b border-ink/20 pb-3">
          <span className="font-display font-bold text-2xl text-palm">
            {name}
          </span>
          <span className="font-mono text-sm text-ink/60">
            № {builderNumber}
          </span>
        </div>
        <div className="flex justify-between font-body text-sm">
          <span className="text-ink/60">Stack</span>
          <span className="font-semibold text-ink">{role}</span>
        </div>
        <div className="flex justify-between font-body text-sm">
          <span className="text-ink/60">Builder class</span>
          <span className="font-semibold text-ink">{builderClass}</span>
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-ink/60">Issue</span>
          <span className="text-ink">2026 · GOA</span>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-[480px] mt-8 space-y-3">
        <Link
          href="/"
          className="tactile-press block w-full bg-feni text-sand font-display font-bold text-lg py-4 px-6 border-2 border-ink text-center hover:bg-feni/90"
        >
          Frame yourself in Goa
        </Link>
        <p className="font-mono text-xs text-ink/50 text-center">
          Upload a photo. Get your builder pass in seconds.
        </p>
      </div>
    </div>
  );
}
