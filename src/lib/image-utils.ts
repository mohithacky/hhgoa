/**
 * Client-side image processing utilities.
 * Handles HEIC conversion, downscaling, and aspect-ratio-safe fitting.
 */

const MAX_DIMENSION = 1200; // longest side after downscale
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public readonly guidance: string,
  ) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

/**
 * Detect if a file is HEIC/HEIF (iPhone photos).
 */
function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  // Some browsers report empty type for HEIC
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "heic" || ext === "heif";
}

/**
 * Convert HEIC to JPEG using heic2any (lazy-loaded so non-iPhone users never pay for it).
 */
async function convertHeic(file: File): Promise<Blob> {
  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
    if (Array.isArray(result)) return result[0];
    return result;
  } catch {
    throw new ImageProcessingError(
      "Couldn't convert that iPhone photo in time.",
      "Try again, or use a JPG/PNG instead of HEIC.",
    );
  }
}

/**
 * Load a File into an HTMLImageElement, processing HEIC and downscaling.
 * Returns the image element + an object URL for the processed blob.
 */
export async function processImage(
  file: File,
): Promise<{ image: HTMLImageElement; url: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageProcessingError(
      `That photo is too large (${(file.size / 1024 / 1024).toFixed(1)} MB).`,
      "Pick a photo under 20 MB.",
    );
  }

  const isSupported =
    file.type.startsWith("image/") &&
    (file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp" ||
      file.type === "image/gif" ||
      isHeic(file) ||
      file.type === "");

  if (!isSupported && !isHeic(file)) {
    throw new ImageProcessingError(
      "That file type isn't supported.",
      "Use JPG, PNG, or a HEIC photo from your phone.",
    );
  }

  let blob: Blob = file;

  // Convert HEIC to JPEG
  if (isHeic(file)) {
    blob = await convertHeic(file);
  }

  // Downscale using createImageBitmap (fast, off-main-thread where supported)
  let url: string;
  try {
    const bitmap = await createImageBitmap(blob, {
      resizeQuality: "high",
      ...(await getResizeOptions(blob)),
    });

    // Draw bitmap to canvas to get a blob URL
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const outputBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!outputBlob) throw new Error("Canvas export failed");
    url = URL.createObjectURL(outputBlob);
  } catch {
    // Fallback: use the blob directly without downscaling
    url = URL.createObjectURL(blob);
  }

  // Load into HTMLImageElement
  const image = await loadImage(url);
  return { image, url };
}

/**
 * Calculate resize options to fit within MAX_DIMENSION on the longest side.
 */
async function getResizeOptions(
  blob: Blob,
): Promise<{ resizeWidth?: number; resizeHeight?: number }> {
  try {
    const img = await loadImage(URL.createObjectURL(blob));
    const { width, height } = img;
    URL.revokeObjectURL(img.src);
    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) return {};
    if (width >= height) {
      return {
        resizeWidth: MAX_DIMENSION,
        resizeHeight: Math.round((height / width) * MAX_DIMENSION),
      };
    }
    return {
      resizeHeight: MAX_DIMENSION,
      resizeWidth: Math.round((width / height) * MAX_DIMENSION),
    };
  } catch {
    return {};
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new ImageProcessingError(
          "Couldn't load that photo.",
          "Try a different photo — JPG or PNG works best.",
        ),
      );
    img.src = src;
  });
}

/**
 * Calculate cover-fit dimensions for drawing an image inside a target box.
 * Returns the source crop (sx, sy, sw, sh) to draw with drawImage.
 *
 * offset and zoom let the user reposition/resize the photo within the well.
 */
export function coverFit(
  imgWidth: number,
  imgHeight: number,
  boxWidth: number,
  boxHeight: number,
  offsetX = 0,
  offsetY = 0,
  zoom = 1,
): { sx: number; sy: number; sw: number; sh: number } {
  const imgRatio = imgWidth / imgHeight;
  const boxRatio = boxWidth / boxHeight;

  let sw: number, sh: number;
  if (imgRatio > boxRatio) {
    // Image is wider — crop sides
    sh = imgHeight;
    sw = imgHeight * boxRatio;
  } else {
    // Image is taller — crop top/bottom
    sw = imgWidth;
    sh = imgWidth / boxRatio;
  }

  // Apply zoom (zoom in = smaller source crop = larger photo)
  sw = sw / zoom;
  sh = sh / zoom;

  // Center + offset
  let sx = (imgWidth - sw) / 2 + offsetX;
  let sy = (imgHeight - sh) / 2 + offsetY;

  // Clamp so we don't go outside the image
  sx = Math.max(0, Math.min(sx, imgWidth - sw));
  sy = Math.max(0, Math.min(sy, imgHeight - sh));

  return { sx, sy, sw, sh };
}
