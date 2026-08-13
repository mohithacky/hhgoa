/**
 * Canvas 2D card renderer — the HH Goa 2026 Builder ID Card.
 *
 * This is the actual product. The card is 1080×1350 (4:5 social format).
 * The same rendering logic is used for the live preview and the download export.
 *
 * Layout (top to bottom):
 *   - Block-print geometric border (kokum-yellow)
 *   - Wordmark "HACKER HOUSE · GOA · 2026" + builder number
 *   - Photo well with Goan-arch top frame (photo dominant, ~56% of card height)
 *   - Name (Clash Display) + role (Mukta label)
 *   - Builder class (Mukta)
 *   - #FrameInGoa pink chip + metadata (Space Mono)
 */

import { COLORS, CARD, PFP, EVENT_META } from "./tokens";
import { coverFit } from "./image-utils";

export type CardFormat = "card" | "pfp";

export interface CardRenderOptions {
  photo: HTMLImageElement | null;
  name: string;
  role: string;
  builderNumber: string;
  builderClass: string;
  offsetX: number;
  offsetY: number;
  zoom: number;
  logo?: HTMLImageElement | null;
  goaMotif?: HTMLImageElement | null;
}

/**
 * Render the full Builder ID Card to a canvas 2D context.
 * `scale` controls output resolution (1 = 1080×1350, 2 = 2160×2700).
 */
export function renderCard(
  ctx: CanvasRenderingContext2D,
  opts: CardRenderOptions,
  scale = 1,
): void {
  const W = CARD.width * scale;
  const H = CARD.height * scale;
  const S = scale; // shorthand

  // ── 1. Background: palm-emerald ground ──
  ctx.fillStyle = COLORS.palmEmerald;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Block-print geometric border ──
  drawBlockBorder(ctx, W, H, S);

  // ── 3. Wordmark + builder number (top band) ──
  const topBandY = 40 * S;
  const topBandH = 56 * S;

  // HH logo image (if provided) or text wordmark
  if (opts.logo) {
    const logoH = 40 * S;
    const logoW = (opts.logo.naturalWidth / opts.logo.naturalHeight) * logoH;
    ctx.drawImage(opts.logo, 64 * S, topBandY + 8 * S, logoW, logoH);
  } else {
    // Text wordmark fallback
    ctx.fillStyle = COLORS.sandCream;
    ctx.font = `700 ${30 * S}px "Clash Display", "Arial Narrow", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${EVENT_META.name.toUpperCase()} · ${EVENT_META.location} · ${EVENT_META.year}`,
      64 * S,
      topBandY + topBandH / 2,
    );
  }

  // Builder number (right side)
  ctx.fillStyle = COLORS.kokumYellow;
  ctx.font = `700 ${22 * S}px "Space Mono", "Courier New", monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `BUILDER № ${opts.builderNumber}`,
    W - 64 * S,
    topBandY + topBandH / 2,
  );

  // ── 4. Photo well — rounded square (matching PFP format) ──
  const wellX = 64 * S;
  const wellY = 120 * S;
  const wellW = W - 128 * S;
  const wellH = CARD.photoWellHeight * S;
  const cornerR = 24 * S;

  // Rounded square background (slightly lighter green for depth)
  ctx.fillStyle = "#0A3326";
  drawRoundedRect(ctx, wellX, wellY, wellW, wellH, cornerR);
  ctx.fill();

  // Draw photo inside rounded square (clipped)
  if (opts.photo) {
    ctx.save();
    drawRoundedRect(ctx, wellX, wellY, wellW, wellH, cornerR);
    ctx.clip();

    const fit = coverFit(
      opts.photo.naturalWidth,
      opts.photo.naturalHeight,
      wellW,
      wellH,
      opts.offsetX,
      opts.offsetY,
      opts.zoom,
    );

    ctx.drawImage(
      opts.photo,
      fit.sx,
      fit.sy,
      fit.sw,
      fit.sh,
      wellX,
      wellY,
      wellW,
      wellH,
    );

    // Subtle gradient overlay at bottom for text legibility
    const grad = ctx.createLinearGradient(0, wellY + wellH - 120 * S, 0, wellY + wellH);
    grad.addColorStop(0, "rgba(11, 61, 46, 0)");
    grad.addColorStop(1, "rgba(11, 61, 46, 0.5)");
    ctx.fillStyle = grad;
    ctx.fillRect(wellX, wellY + wellH - 120 * S, wellW, 120 * S);

    ctx.restore();
  } else {
    // Placeholder: darker green fill
    ctx.save();
    drawRoundedRect(ctx, wellX, wellY, wellW, wellH, cornerR);
    ctx.clip();
    ctx.fillStyle = "#0A3326";
    ctx.fillRect(wellX, wellY, wellW, wellH);
    ctx.restore();
  }

  // Rounded square hairline frame (kokum-yellow)
  ctx.strokeStyle = COLORS.kokumYellow;
  ctx.lineWidth = 4 * S;
  drawRoundedRect(ctx, wellX, wellY, wellW, wellH, cornerR);
  ctx.stroke();

  // ── 5. Name + role ──
  const textY = wellY + wellH + 48 * S;
  const textX = 64 * S;
  const textW = W - 128 * S;

  // Name (Clash Display, large)
  ctx.fillStyle = COLORS.sandCream;
  ctx.font = `600 ${48 * S}px "Clash Display", "Arial Narrow", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const displayName = opts.name.trim() || "YOUR NAME";
  ctx.fillText(displayName.toUpperCase(), textX, textY);

  // Role (Mukta, label-style)
  ctx.fillStyle = COLORS.kokumYellow;
  ctx.font = `600 ${22 * S}px "Mukta", system-ui, sans-serif`;
  const roleY = textY + 56 * S;
  ctx.fillText(opts.role.toUpperCase(), textX, roleY);

  // Builder class (Mukta, with label prefix)
  ctx.fillStyle = COLORS.surfTeal;
  ctx.font = `500 ${20 * S}px "Mukta", system-ui, sans-serif`;
  ctx.fillText(
    `BUILDER CLASS · ${opts.builderClass}`,
    textX,
    roleY + 32 * S,
  );

  // Goan Hindi "GOA" motif — subtle watermark on the right side
  if (opts.goaMotif) {
    const motifSize = 120 * S;
    const motifX = textX + textW - motifSize - 10 * S;
    const motifY = textY + 20 * S;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.drawImage(opts.goaMotif, motifX, motifY, motifSize, motifSize);
    ctx.restore();
  }

  // ── 6. #FrameInGoa pink chip + metadata ──
  const chipY = H - 100 * S;
  const chipH = 40 * S;
  const chipPadding = 16 * S;

  // Chip text
  ctx.font = `700 ${18 * S}px "Space Mono", "Courier New", monospace`;
  const chipText = EVENT_META.hashtag;
  const chipTextW = ctx.measureText(chipText).width;
  const chipW = chipTextW + chipPadding * 2;

  // Chip background (hot pink)
  ctx.fillStyle = COLORS.feniPink;
  ctx.fillRect(textX, chipY, chipW, chipH);

  // Chip text
  ctx.fillStyle = COLORS.sandCream;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(chipText, textX + chipPadding, chipY + chipH / 2);

  // Metadata (right side, Space Mono)
  ctx.fillStyle = COLORS.sandCream;
  ctx.font = `400 ${16 * S}px "Space Mono", "Courier New", monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `${EVENT_META.coords} · ISSUE ${EVENT_META.year}`,
    textX + textW,
    chipY + chipH / 2,
  );

  // ── 7. Bottom block-print border echo ──
  drawBlockBorderBottom(ctx, W, H, S);
}

/**
 * Render the PFP (Profile Picture) Frame — Format A.
 * Square 1080×1080. The photo fills the center; a branded HH Goa frame wraps it.
 *
 * Layout:
 *   - Palm-emerald background with block-print border
 *   - Top bar: HH logo + builder number
 *   - Center: photo in a rounded square with kokum-yellow frame
 *   - Bottom bar: name + #FrameInGoa chip
 */
export function renderPFP(
  ctx: CanvasRenderingContext2D,
  opts: CardRenderOptions,
  scale = 1,
): void {
  const W = PFP.width * scale;
  const H = PFP.height * scale;
  const S = scale;

  // ── 1. Background ──
  ctx.fillStyle = COLORS.palmEmerald;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Block-print border (all four sides) ──
  drawBlockBorder(ctx, W, H, S);
  drawBlockBorderBottom(ctx, W, H, S);

  // ── 3. Top bar: HH logo + builder number ──
  const topY = 36 * S;
  if (opts.logo) {
    const logoH = 32 * S;
    const logoW = (opts.logo.naturalWidth / opts.logo.naturalHeight) * logoH;
    ctx.drawImage(opts.logo, PFP.photoInset * S, topY, logoW, logoH);
  } else {
    ctx.fillStyle = COLORS.sandCream;
    ctx.font = `700 ${20 * S}px "Clash Display", "Arial Narrow", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("HACKER HOUSE GOA", PFP.photoInset * S, topY + 16 * S);
  }

  ctx.fillStyle = COLORS.kokumYellow;
  ctx.font = `700 ${16 * S}px "Space Mono", "Courier New", monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(`№ ${opts.builderNumber}`, W - PFP.photoInset * S, topY + 16 * S);

  // ── 4. Photo area — rounded square, centered ──
  const photoSize = W - PFP.photoInset * 2 * S;
  const photoX = PFP.photoInset * S;
  const photoY = (H - photoSize) / 2;
  const cornerR = 24 * S;

  // Photo background
  ctx.fillStyle = "#0A3326";
  drawRoundedRect(ctx, photoX, photoY, photoSize, photoSize, cornerR);
  ctx.fill();

  // Draw photo (clipped to rounded square)
  if (opts.photo) {
    ctx.save();
    drawRoundedRect(ctx, photoX, photoY, photoSize, photoSize, cornerR);
    ctx.clip();

    const fit = coverFit(
      opts.photo.naturalWidth,
      opts.photo.naturalHeight,
      photoSize,
      photoSize,
      opts.offsetX,
      opts.offsetY,
      opts.zoom,
    );

    ctx.drawImage(
      opts.photo,
      fit.sx,
      fit.sy,
      fit.sw,
      fit.sh,
      photoX,
      photoY,
      photoSize,
      photoSize,
    );
    ctx.restore();
  }

  // Kokum-yellow frame around photo
  ctx.strokeStyle = COLORS.kokumYellow;
  ctx.lineWidth = 6 * S;
  drawRoundedRect(ctx, photoX, photoY, photoSize, photoSize, cornerR);
  ctx.stroke();

  // ── 5. Bottom bar: name + #FrameInGoa ──
  const bottomY = H - 80 * S;
  const displayName = opts.name.trim() || "YOUR NAME";

  // Name (left)
  ctx.fillStyle = COLORS.sandCream;
  ctx.font = `600 ${24 * S}px "Clash Display", "Arial Narrow", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  // Truncate if too long
  const maxNameW = W - PFP.photoInset * 2 * S - 200 * S;
  let nameText = displayName.toUpperCase();
  while (ctx.measureText(nameText).width > maxNameW && nameText.length > 3) {
    nameText = nameText.slice(0, -1);
  }
  if (nameText !== displayName.toUpperCase()) nameText += "…";
  ctx.fillText(nameText, PFP.photoInset * S, bottomY);

  // #FrameInGoa chip (right)
  ctx.font = `700 ${14 * S}px "Space Mono", "Courier New", monospace`;
  const chipText = EVENT_META.hashtag;
  const chipTextW = ctx.measureText(chipText).width;
  const chipPad = 12 * S;
  const chipW = chipTextW + chipPad * 2;
  const chipH = 28 * S;
  const chipX = W - PFP.photoInset * S - chipW;
  const chipY = bottomY - chipH / 2;

  ctx.fillStyle = COLORS.feniPink;
  ctx.fillRect(chipX, chipY, chipW, chipH);
  ctx.fillStyle = COLORS.sandCream;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(chipText, chipX + chipPad, bottomY);

  // ── 6. Goan Hindi motif — subtle watermark in corner ──
  if (opts.goaMotif) {
    const motifSize = 60 * S;
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.drawImage(opts.goaMotif, W - motifSize - 40 * S, topY - 10 * S, motifSize, motifSize);
    ctx.restore();
  }
}

/**
 * Draw a rounded rectangle path.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Draw the Goan arch path: rounded top (semicircle) + straight sides + flat bottom.
 */
function drawArchPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  const r = Math.min(radius, w / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  // Left side up to arch start
  ctx.lineTo(x, y + r);
  // Arch (semicircle top)
  ctx.arc(x + w / 2, y + r, w / 2, Math.PI, 0, false);
  // Right side down
  ctx.lineTo(x + w, y + h);
  // Bottom
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

/**
 * Block-print geometric border — repeating triangles along top and sides.
 * Inspired by Indian/Goan block-print textile patterns.
 */
function drawBlockBorder(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  S: number,
): void {
  const triangleSize = 12 * S;
  const borderInset = 20 * S;

  ctx.fillStyle = COLORS.kokumYellow;

  // Top border: row of triangles pointing down
  for (let x = borderInset; x < W - borderInset; x += triangleSize * 2) {
    drawTriangle(ctx, x, borderInset, triangleSize, "down");
    drawTriangle(ctx, x + triangleSize, borderInset, triangleSize, "down");
  }

  // Left border: triangles pointing right
  for (let y = borderInset + triangleSize * 2; y < H - borderInset - triangleSize * 2; y += triangleSize * 2) {
    drawTriangle(ctx, borderInset, y, triangleSize, "right");
  }

  // Right border: triangles pointing left
  for (let y = borderInset + triangleSize * 2; y < H - borderInset - triangleSize * 2; y += triangleSize * 2) {
    drawTriangle(ctx, W - borderInset - triangleSize, y, triangleSize, "left");
  }
}

/**
 * Bottom border echo — thinner, with surf-teal accents.
 */
function drawBlockBorderBottom(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  S: number,
): void {
  const triangleSize = 10 * S;
  const borderInset = 20 * S;

  // Bottom: alternating yellow/teal triangles pointing up
  for (let x = borderInset, i = 0; x < W - borderInset; x += triangleSize * 2, i++) {
    ctx.fillStyle = i % 2 === 0 ? COLORS.kokumYellow : COLORS.surfTeal;
    drawTriangle(ctx, x, H - borderInset - triangleSize, triangleSize, "up");
  }
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: "up" | "down" | "left" | "right",
): void {
  ctx.beginPath();
  switch (direction) {
    case "down":
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size / 2, y + size);
      break;
    case "up":
      ctx.moveTo(x, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x + size / 2, y);
      break;
    case "right":
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x + size, y + size / 2);
      break;
    case "left":
      ctx.moveTo(x + size, y);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x, y + size / 2);
      break;
  }
  ctx.closePath();
  ctx.fill();
}
