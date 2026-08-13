"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  COLORS,
  ROLES,
  CARD,
  builderNumberFromName,
  builderClassFromName,
} from "@/lib/tokens";
import {
  processImage,
  ImageProcessingError,
} from "@/lib/image-utils";
import { renderCard } from "@/lib/card-canvas";
import { buildXIntentUrl, buildShareUrl, buildFallbackShareText } from "@/lib/share";

type Phase = "upload" | "preview" | "issued";

export function BuilderPassTool() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("Frontend");
  const [customRole, setCustomRole] = useState("");
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<{ msg: string; guide: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stamping, setStamping] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Theme images (HH Goa branding)
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [goaMotif, setGoaMotif] = useState<HTMLImageElement | null>(null);

  // Load theme images on mount
  useEffect(() => {
    const logoImg = new Image();
    logoImg.src = "/hacker-house.png";
    logoImg.onload = () => setLogo(logoImg);
    const motifImg = new Image();
    motifImg.src = "/goa-hindi.svg";
    motifImg.onload = () => setGoaMotif(motifImg);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragState = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });

  const builderNumber = useMemo(
    () => builderNumberFromName(name || "builder"),
    [name],
  );
  const builderClass = useMemo(
    () => builderClassFromName(name || "builder"),
    [name],
  );

  // Effective role: use custom text if "Other…" is selected, else the preset
  const effectiveRole = role === "__custom__" ? (customRole.trim() || "Builder") : role;

  // ── Canvas rendering ──
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure fonts are loaded before rendering
    const doRender = () => {
      renderCard(ctx, {
        photo,
        name,
        role: effectiveRole,
        builderNumber,
        builderClass,
        offsetX,
        offsetY,
        zoom,
        logo,
        goaMotif,
      });
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(doRender);
    } else {
      doRender();
    }
  }, [photo, name, effectiveRole, builderNumber, builderClass, offsetX, offsetY, zoom, logo, goaMotif]);

  useEffect(() => {
    if (phase === "preview" || phase === "issued") {
      render();
    }
  }, [render, phase]);

  // ── File handling ──
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setProcessing(true);
    try {
      const { image } = await processImage(file);
      setPhoto(image);
      setOffsetX(0);
      setOffsetY(0);
      setZoom(1);
      setPhase("preview");
    } catch (e) {
      if (e instanceof ImageProcessingError) {
        setError({ msg: e.message, guide: e.guidance });
      } else {
        setError({
          msg: "Could not process that photo.",
          guide: "Try a different one — JPG or PNG works best.",
        });
      }
    } finally {
      setProcessing(false);
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // allow re-selecting same file
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // ── Photo repositioning (pointer drag on canvas) ──
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== "preview") return;
    if (!photo) return;
    setDragging(true);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
    };
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    // Scale drag to image coordinates (canvas display size vs actual image)
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = photo!.naturalWidth / rect.width;
    const scaleY = photo!.naturalHeight / rect.height;
    setOffsetX(dragState.current.startOffsetX - dx * scaleX * 0.5);
    setOffsetY(dragState.current.startOffsetY - dy * scaleY * 0.5);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDragging(false);
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (phase !== "preview") return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(1, Math.min(4, z + delta)));
  };

  // ── Issue pass (stamp animation) ──
  const handleIssue = () => {
    setStamping(true);
    setTimeout(() => {
      setStamping(false);
      setPhase("issued");
      // Build share URL
      const url = buildShareUrl(window.location.origin, {
        name: name || "Anonymous Builder",
        role: effectiveRole,
        builderNumber,
        builderClass,
      });
      setShareUrl(url);
    }, 400);
  };

  // ── Re-issue (back to preview) ──
  const handleReissue = () => {
    setPhase("preview");
    setShareUrl(null);
  };

  // ── Render card to a blob (shared by download + share) ──
  const renderCardToBlob = async (): Promise<Blob | null> => {
    // Wait for fonts
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = CARD.width * CARD.exportScale;
    exportCanvas.height = CARD.height * CARD.exportScale;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");

    renderCard(ctx, {
      photo,
      name,
      role: effectiveRole,
      builderNumber,
      builderClass,
      offsetX,
      offsetY,
      zoom,
      logo,
      goaMotif,
    }, CARD.exportScale);

    return new Promise((resolve) => {
      exportCanvas.toBlob(resolve, "image/png");
    });
  };

  // ── Download ──
  const handleDownload = async () => {
    try {
      const blob = await renderCardToBlob();
      if (!blob) {
        setError({
          msg: "Couldn't export your pass.",
          guide: "Your photo is still here — try Download again.",
        });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hhgoa-2026-builder-pass.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError({
        msg: "Couldn't export your pass.",
        guide: "Your photo is still here — try Download again.",
      });
    }
  };

  // ── Share on X ──
  // Opens X directly with the #FrameInGoa caption + share URL.
  // The image appears in the post as an OG link card: X fetches the /c page,
  // reads its og:image (the generated card from /api/og), and renders it inline.
  const handleShare = () => {
    if (!shareUrl) return;
    const xUrl = buildXIntentUrl(shareUrl);
    window.open(xUrl, "_blank", "noopener,noreferrer");
  };

  // ── Copy fallback ──
  const handleCopy = async () => {
    if (!shareUrl) return;
    const text = buildFallbackShareText(shareUrl);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  // ── Reset ──
  const handleReset = () => {
    setPhase("upload");
    setPhoto(null);
    setName("");
    setRole("Frontend");
    setCustomRole("");
    setOffsetX(0);
    setOffsetY(0);
    setZoom(1);
    setError(null);
    setShareUrl(null);
  };

  return (
    <div className="flex flex-col flex-1 lg:flex-row">
      {/* ── Left rail: wordmark + metadata (palm-emerald) ── */}
      <aside className="bg-palm text-sand flex flex-col justify-between p-6 lg:w-[38%] lg:min-h-screen lg:p-10 lg:fixed lg:left-0 lg:top-0 lg:bottom-0 relative overflow-hidden">
        {/* Sunrise texture — subtle background */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "url(/sun-rise.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />

        {/* Vertical wordmark — desktop */}
        <div className="hidden lg:flex flex-col gap-0 leading-none relative z-10">
          {/* HH logo */}
          <img
            src="/hacker-house.png"
            alt="Hacker House logo"
            width={180}
            height={37}
            className="h-9 w-auto mb-6 brightness-0 invert"
          />
          {"HACKER HOUSE".split("").map((c, i) => (
            <span
              key={i}
              className="font-display font-bold text-2xl tracking-tight text-sand"
              style={{ lineHeight: "1.1" }}
            >
              {c === " " ? "\u00A0" : c}
            </span>
          ))}
          <div className="h-4" />
          {"GOA · 2026".split("").map((c, i) => (
            <span
              key={i}
              className="font-display font-bold text-2xl tracking-tight text-kokum"
              style={{ lineHeight: "1.1" }}
            >
              {c === " " ? "\u00A0" : c}
            </span>
          ))}
        </div>

        {/* Mobile wordmark */}
        <div className="lg:hidden flex items-center justify-between relative z-10">
          <img
            src="/hacker-house.png"
            alt="Hacker House logo"
            width={140}
            height={29}
            className="h-7 w-auto brightness-0 invert"
          />
          <span className="font-mono text-xs text-feni bg-feni/20 px-2 py-1 border border-feni">
            #FrameInGoa
          </span>
        </div>

        {/* Headline + metadata */}
        <div className="mt-8 lg:mt-0 lg:pb-8 relative z-10">
          <h1
            className="font-display font-bold text-4xl lg:text-5xl leading-[0.95] tracking-tight text-sand mb-3"
            style={{ textWrap: "balance" }}
          >
            Frame yourself in Goa.
          </h1>
          <p className="font-body text-base lg:text-lg text-sand/70 leading-relaxed mb-6 max-w-sm">
            Upload a photo. Get your Hacker House Goa 2026 builder pass in seconds.
          </p>

          {/* Goan Hindi "GOA" motif — decorative */}
          <img
            src="/goa-hindi.svg"
            alt=""
            width={60}
            height={60}
            className="hidden lg:block absolute -right-2 top-0 opacity-30"
            aria-hidden="true"
          />

          {/* Metadata grid */}
          <div className="border-t border-sand/20 pt-4 space-y-2">
            <div className="flex justify-between font-mono text-xs text-sand/60">
              <span>LOCATION</span>
              <span className="text-sand">GOA · 15.3N 73.9E</span>
            </div>
            <div className="flex justify-between font-mono text-xs text-sand/60">
              <span>ISSUE</span>
              <span className="text-sand">2026</span>
            </div>
            <div className="flex justify-between font-mono text-xs text-sand/60">
              <span>FORMAT</span>
              <span className="text-sand">BUILDER PASS</span>
            </div>
            <div className="flex justify-between font-mono text-xs text-sand/60">
              <span>HASHTAG</span>
              <span className="text-feni">#FrameInGoa</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right stage: card + controls (sand-cream) ── */}
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center p-4 lg:p-10 lg:ml-[38%] relative"
      >
        {/* Decorative pattern — top-right corner */}
        <img
          src="/pattern-2-47.svg"
          alt=""
          width={120}
          height={74}
          className="hidden lg:block absolute top-6 right-6 opacity-[0.06] pointer-events-none"
          aria-hidden="true"
        />
        {/* Error display */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="w-full max-w-md mb-6 border-2 border-feni bg-feni/10 p-4"
          >
            <p className="font-display font-semibold text-feni text-sm">
              {error.msg}
            </p>
            <p className="font-body text-sm text-ink/70 mt-1">{error.guide}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 font-mono text-xs text-feni underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Card canvas */}
        <div
          className={`relative w-full max-w-[420px] lg:max-w-[480px] ${
            stamping ? "stamp-animate" : ""
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          {phase === "upload" ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="dashed-well bg-palm/90 w-full aspect-[4/5] flex flex-col items-center justify-center gap-4 p-8 cursor-pointer hover:bg-palm transition-colors tactile-press"
              aria-label="Upload a photo for your builder pass"
            >
              {processing ? (
                <>
                  <div className="w-8 h-8 border-2 border-kokum border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono text-sm text-kokum">
                    Processing photo…
                  </span>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <span className="font-display font-semibold text-xl text-sand text-center">
                    Drop a photo
                  </span>
                  <span className="font-body text-sm text-sand/60 text-center">
                    selfie, portrait, whatever you&apos;ve got
                  </span>
                  <span className="font-mono text-xs text-kokum mt-2 border border-kokum px-3 py-1">
                    JPG · PNG · HEIC
                  </span>
                </>
              )}
            </button>
          ) : (
            <div
              className={`relative w-full aspect-[4/5] bg-palm ${
                stamping ? "flash-animate" : ""
              }`}
            >
              <canvas
                ref={canvasRef}
                width={CARD.width}
                height={CARD.height}
                className="w-full h-full block touch-none cursor-grab"
                style={{ cursor: dragging ? "grabbing" : "grab" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
                aria-label="Your builder pass preview"
              />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif,image/*"
            onChange={onFileInput}
            className="sr-only"
            aria-label="Upload a photo for your builder pass"
          />
        </div>

        {/* Controls */}
        <div className="w-full max-w-[420px] lg:max-w-[480px] mt-6 space-y-4">
          {phase === "upload" && !processing && (
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="tactile-press w-full bg-kokum text-palm font-display font-bold text-lg py-4 px-6 border-2 border-ink hover:bg-kokum/90"
              >
                Choose a photo
              </button>
              <p className="font-mono text-xs text-ink/50 text-center">
                No login. No signup. One pass and you&apos;re done.
              </p>
            </div>
          )}

          {phase === "preview" && (
            <div className="space-y-4">
              {/* Name input */}
              <div>
                <label
                  htmlFor="name"
                  className="block font-mono text-xs text-ink/60 uppercase tracking-wider mb-1"
                >
                  Your name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aisha Rao…"
                  maxLength={30}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-transparent border-2 border-ink px-4 py-3 font-display font-semibold text-lg text-ink placeholder:text-ink/30 focus:outline-none focus:border-feni"
                />
              </div>

              {/* Role selector */}
              <div>
                <label
                  htmlFor="role"
                  className="block font-mono text-xs text-ink/60 uppercase tracking-wider mb-1"
                >
                  Stack / role
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        setCustomRole("");
                      }}
                      className={`tactile-press font-body text-sm px-3 py-2 border-2 border-ink transition-colors ${
                        role === r && !customRole
                          ? "bg-palm text-sand"
                          : "bg-transparent text-ink hover:bg-ink/5"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                  {/* Custom role toggle */}
                  <button
                    onClick={() => setRole("__custom__")}
                    className={`tactile-press font-body text-sm px-3 py-2 border-2 border-ink transition-colors ${
                      role === "__custom__"
                        ? "bg-palm text-sand"
                        : "bg-transparent text-ink hover:bg-ink/5"
                    }`}
                  >
                    Other…
                  </button>
                </div>
                {/* Custom role text input */}
                {role === "__custom__" && (
                  <input
                    id="role"
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Type your stack…"
                    maxLength={24}
                    autoComplete="off"
                    spellCheck={false}
                    className="mt-2 w-full bg-transparent border-2 border-ink px-4 py-3 font-body text-base text-ink placeholder:text-ink/30 focus:outline-none focus:border-feni"
                    autoFocus
                  />
                )}
              </div>

              {/* Zoom control */}
              <div>
                <label
                  htmlFor="zoom"
                  className="block font-mono text-xs text-ink/60 uppercase tracking-wider mb-1"
                >
                  Photo zoom — drag to reposition
                </label>
                <input
                  id="zoom"
                  type="range"
                  min="1"
                  max="4"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-feni"
                />
              </div>

              {/* Issue button */}
              <button
                onClick={handleIssue}
                className="tactile-press w-full bg-feni text-sand font-display font-bold text-xl py-4 px-6 border-2 border-ink hover:bg-feni/90"
              >
                Issue my pass
              </button>
            </div>
          )}

          {phase === "issued" && (
            <div className="space-y-4">
              <p className="font-display font-semibold text-lg text-palm text-center">
                Your pass is ready.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownload}
                  className="tactile-press flex-1 bg-kokum text-palm font-display font-bold text-lg py-4 px-6 border-2 border-ink hover:bg-kokum/90"
                >
                  Download pass
                </button>
                <button
                  onClick={handleShare}
                  className="tactile-press flex-1 bg-palm text-sand font-display font-bold text-lg py-4 px-6 border-2 border-ink hover:bg-palm/90"
                >
                  Share on X
                </button>
              </div>

              {/* Fallback copy section */}
              <div className="border-2 border-ink/20 p-3 bg-ink/5">
                <p className="font-mono text-xs text-ink/60 mb-2">
                  X didn&apos;t open? Download the pass, then copy this caption:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    aria-live="polite"
                    className="tactile-press flex-1 font-mono text-xs text-ink border border-ink/40 px-3 py-2 hover:bg-ink/5"
                  >
                    {copied ? "Copied!" : "Copy caption + link"}
                  </button>
                  <button
                    onClick={handleReissue}
                    className="tactile-press font-mono text-xs text-ink/60 underline px-3 py-2"
                  >
                    Re-issue
                  </button>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="tactile-press w-full font-mono text-xs text-ink/50 underline py-2"
              >
                Start over with a new photo
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 6L24 32M24 6L16 14M24 6L32 14"
        stroke={COLORS.kokumYellow}
        strokeWidth="3"
        strokeLinecap="square"
      />
      <path
        d="M8 32V38C8 39.1 8.9 40 10 40H38C39.1 40 40 39.1 40 38V32"
        stroke={COLORS.kokumYellow}
        strokeWidth="3"
        strokeLinecap="square"
      />
    </svg>
  );
}
