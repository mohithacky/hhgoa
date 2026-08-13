/**
 * HH Goa 2026 — shared design tokens.
 * Single source of truth for the client canvas renderer and the server OG renderer.
 * Changing a value here changes both the live preview/download and the OG image.
 */

export const COLORS = {
  palmEmerald: "#0B3D2E",
  kokumYellow: "#F5C518",
  feniPink: "#FF2E63",
  sandCream: "#F4ECD8",
  inkBlack: "#0A0A0A",
  surfTeal: "#1FB58F",
} as const;

export const FONTS = {
  display: "Clash Display",
  body: "Mukta",
  mono: "Space Mono",
} as const;

/**
 * Card dimensions.
 * 4:5 social format (1080x1350), exported at 2x for crisp downloads.
 */
export const CARD = {
  width: 1080,
  height: 1350,
  exportScale: 2, // export at 2160x2700
  padding: 64,
  borderWidth: 6,
  photoWellHeight: 720,
} as const;

/**
 * PFP (Profile Picture) dimensions.
 * Square 1080x1080, exported at 2x for crisp downloads.
 */
export const PFP = {
  width: 1080,
  height: 1080,
  exportScale: 2,
  frameWidth: 80, // branded border thickness
  photoInset: 120, // distance from edge to photo area
} as const;

/**
 * Builder classes — generated from the user's name hash.
 * Each evokes a builder archetype tied to the HH Goa ethos.
 */
export const BUILDER_CLASSES = [
  "SHIP-WEAVER",
  "NIGHT-FORGER",
  "PROTOCOL-DJ",
  "STACK-CARTOGRAPHER",
  "DAWN-DEPLOYER",
  "INTERFACE-SMITH",
  "SYSTEMS-BARD",
  "PIXEL-ALCHEMIST",
  "AGENT-TAMER",
  "EDGE-RUNNER",
] as const;

/**
 * Roles the user can pick from.
 */
export const ROLES = [
  "Frontend",
  "Backend",
  "Full-Stack",
  "Design",
  "AI/ML",
  "DevTools",
  "Hardware",
  "Onchain",
] as const;

/**
 * The X share caption. #FrameInGoa is locked in the middle — never appended,
 * never user-editable, so it cannot accidentally disappear.
 */
export const SHARE_CAPTION =
  "Just stamped my builder pass for Hacker House Goa 2026 \uD83C\uDF34 #FrameInGoa";

/**
 * Event metadata shown on the card.
 */
export const EVENT_META = {
  name: "Hacker House Goa",
  year: "2026",
  location: "GOA",
  coords: "15.3N 73.9E",
  hashtag: "#FrameInGoa",
} as const;

/**
 * Deterministic builder number from a name string.
 * Returns a zero-padded 4-digit number (e.g. "0042").
 */
export function builderNumberFromName(name: string): string {
  let hash = 0;
  const trimmed = name.trim().toLowerCase();
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) - hash + trimmed.charCodeAt(i)) | 0;
  }
  const num = Math.abs(hash) % 9000 + 1000;
  return String(num);
}

/**
 * Deterministic builder class from a name string.
 */
export function builderClassFromName(name: string): string {
  let hash = 0;
  const trimmed = name.trim().toLowerCase();
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) - hash + trimmed.charCodeAt(i)) | 0;
  }
  return BUILDER_CLASSES[Math.abs(hash) % BUILDER_CLASSES.length];
}
