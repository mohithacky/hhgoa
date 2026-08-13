import { SHARE_CAPTION } from "./tokens";

/**
 * Build the X (Twitter) intent URL.
 *
 * #FrameInGoa is baked into SHARE_CAPTION — a constant that is never
 * concatenated from user input, so the hashtag cannot accidentally disappear.
 *
 * The share URL points to /c which carries OG metadata + a branded card image.
 */
export function buildXIntentUrl(shareUrl: string): string {
  const params = new URLSearchParams({
    text: SHARE_CAPTION,
    url: shareUrl,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Build the /c share page URL from card params.
 * Photo URL is optional — if absent, the share page shows a branded card
 * with the user's metadata but a stylized placeholder instead of their photo.
 */
export function buildShareUrl(
  origin: string,
  params: {
    name: string;
    role: string;
    builderNumber: string;
    builderClass: string;
    photoUrl?: string;
    format?: string;
  },
): string {
  const query = new URLSearchParams({
    n: params.name,
    r: params.role,
    b: params.builderNumber,
    c: params.builderClass,
  });
  if (params.photoUrl) {
    query.set("p", params.photoUrl);
  }
  if (params.format && params.format !== "card") {
    query.set("f", params.format);
  }
  return `${origin}/c?${query.toString()}`;
}

/**
 * The copyable fallback caption + link (shown alongside the X button
 * in case X doesn't open). #FrameInGoa is guaranteed present.
 */
export function buildFallbackShareText(shareUrl: string): string {
  return `${SHARE_CAPTION} — claim yours: ${shareUrl}`;
}
