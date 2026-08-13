import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { COLORS, CARD, EVENT_META } from "@/lib/tokens";

export const runtime = "nodejs";

// Preload fonts at module scope (Satori needs ArrayBuffer)
const fontsDir = join(process.cwd(), "public", "fonts");

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

interface FontEntry {
  name: string;
  data: Buffer;
  weight: FontWeight;
  style: "normal";
}

async function loadFont(
  name: string,
  file: string,
  weight: FontWeight,
): Promise<FontEntry> {
  const data = await readFile(join(fontsDir, file));
  return { name, data, weight, style: "normal" };
}

let fontCache: FontEntry[] | null = null;

async function getFonts(): Promise<FontEntry[]> {
  if (fontCache) return fontCache;
  fontCache = [
    await loadFont("Clash Display", "ClashDisplay-Regular.ttf", 400),
    await loadFont("Clash Display", "ClashDisplay-SemiBold.ttf", 600),
    await loadFont("Clash Display", "ClashDisplay-Bold.ttf", 700),
    await loadFont("Mukta", "Mukta-Regular.woff", 400),
    await loadFont("Mukta", "Mukta-Medium.woff", 500),
    await loadFont("Mukta", "Mukta-SemiBold.woff", 600),
    await loadFont("Mukta", "Mukta-Bold.woff", 700),
    await loadFont("Space Mono", "SpaceMono-Regular.woff", 400),
    await loadFont("Space Mono", "SpaceMono-Bold.woff", 700),
  ];
  return fontCache;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("n") || "YOUR NAME";
    const role = searchParams.get("r") || "Frontend";
    const builderNumber = searchParams.get("b") || "0001";
    const builderClass = searchParams.get("c") || "SHIP-WEAVER";
    const photoUrl = searchParams.get("p");

    const fonts = await getFonts();

    // Construct absolute URL for the HH logo (Satori needs absolute URLs)
    const origin = new URL(request.url).origin;
    const logoUrl = `${origin}/hacker-house.png`;

    return new ImageResponse(
      <CardImage
        name={name}
        role={role}
        builderNumber={builderNumber}
        builderClass={builderClass}
        photoUrl={photoUrl}
        logoUrl={logoUrl}
      />,
      {
        width: CARD.width,
        height: CARD.height,
        fonts,
      },
    );
  } catch (e) {
    console.error("OG generation failed:", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}

function CardImage({
  name,
  role,
  builderNumber,
  builderClass,
  photoUrl,
  logoUrl,
}: {
  name: string;
  role: string;
  builderNumber: string;
  builderClass: string;
  photoUrl: string | null;
  logoUrl: string;
}) {
  const W = CARD.width;
  const H = CARD.height;
  const pad = CARD.padding;
  const wellW = W - pad * 2;
  const wellH = CARD.photoWellHeight;

  return (
    <div
      style={{
        width: W,
        height: H,
        backgroundColor: COLORS.palmEmerald,
        display: "flex",
        flexDirection: "column",
        padding: pad,
        fontFamily: "Mukta",
        position: "relative",
      }}
    >
      {/* Block-print border — top row of triangles */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          height: 12,
          display: "flex",
          flexDirection: "row",
        }}
      >
        {Array.from({ length: Math.floor((W - 40) / 24) }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `12px solid ${COLORS.kokumYellow}`,
              marginRight: 0,
            }}
          />
        ))}
      </div>

      {/* Top band: HH logo + builder number */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 24,
          marginBottom: 16,
        }}
      >
        {/* HH logo */}
        <img
          src={logoUrl}
          alt="Hacker House"
          width={200}
          height={41}
          style={{
            height: 40,
            width: "auto",
            objectFit: "contain",
          }}
        />
        <span
          style={{
            fontFamily: "Space Mono",
            fontWeight: 700,
            fontSize: 22,
            color: COLORS.kokumYellow,
          }}
        >
          BUILDER № {builderNumber}
        </span>
      </div>

      {/* Photo well with Goan-arch frame */}
      <div
        style={{
          width: wellW,
          height: wellH,
          backgroundColor: "#0A3326",
          border: `4px solid ${COLORS.kokumYellow}`,
          borderRadius: `${wellW / 2}px ${wellW / 2}px 0px 0px`,
          overflow: "hidden",
          display: "flex",
          alignSelf: "center",
          marginTop: 8,
        }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0A3326",
            }}
          >
            <span
              style={{
                fontFamily: "Space Mono",
                fontSize: 18,
                color: COLORS.kokumYellow,
                opacity: 0.4,
              }}
            >
              [ PHOTO ]
            </span>
          </div>
        )}
      </div>

      {/* Name + role + builder class */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 48,
          paddingLeft: 0,
        }}
      >
        <span
          style={{
            fontFamily: "Clash Display",
            fontWeight: 600,
            fontSize: 48,
            color: COLORS.sandCream,
            letterSpacing: "-0.01em",
            lineHeight: 1.0,
          }}
        >
          {name.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: "Mukta",
            fontWeight: 600,
            fontSize: 22,
            color: COLORS.kokumYellow,
            marginTop: 12,
            letterSpacing: "0.02em",
          }}
        >
          {role.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: "Mukta",
            fontWeight: 500,
            fontSize: 20,
            color: COLORS.surfTeal,
            marginTop: 8,
          }}
        >
          BUILDER CLASS · {builderClass}
        </span>
      </div>

      {/* Bottom: #FrameInGoa chip + metadata */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.feniPink,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "Space Mono",
              fontWeight: 700,
              fontSize: 18,
              color: COLORS.sandCream,
            }}
          >
            {EVENT_META.hashtag}
          </span>
        </div>
        <span
          style={{
            fontFamily: "Space Mono",
            fontSize: 16,
            color: COLORS.sandCream,
          }}
        >
          {EVENT_META.coords} · ISSUE {EVENT_META.year}
        </span>
      </div>

      {/* Bottom block-print border */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          height: 10,
          display: "flex",
          flexDirection: "row",
        }}
      >
        {Array.from({ length: Math.floor((W - 40) / 20) }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderBottom: `10px solid ${
                i % 2 === 0 ? COLORS.kokumYellow : COLORS.surfTeal
              }`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
