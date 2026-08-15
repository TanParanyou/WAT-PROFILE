import { classifyMediaSource } from "@/lib/mediaOrigins";

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type MediaCropLoadCode = "unmanaged_source" | "load_failed" | "invalid_image";

export class MediaCropLoadError extends Error {
  constructor(readonly code: MediaCropLoadCode) {
    super(code);
    this.name = "MediaCropLoadError";
  }
}

async function browserImageSource(url: string): Promise<{ src: string; cleanup: () => void }> {
  const kind = classifyMediaSource(url);

  if (kind === "local") {
    return { src: url, cleanup: () => undefined };
  }

  if (kind !== "managed") {
    throw new MediaCropLoadError("unmanaged_source");
  }

  try {
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
      throw new MediaCropLoadError("invalid_image");
    }

    const objectUrl = URL.createObjectURL(await response.blob());
    return { src: objectUrl, cleanup: () => URL.revokeObjectURL(objectUrl) };
  } catch (error: unknown) {
    if (error instanceof MediaCropLoadError) {
      throw error;
    }
    throw new MediaCropLoadError("load_failed");
  }
}

export async function createImage(
  url: string
): Promise<{ image: HTMLImageElement; cleanup: () => void }> {
  const { src: imageSrc, cleanup } = await browserImageSource(url);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve({ image, cleanup }));
    image.addEventListener("error", () => {
      cleanup();
      reject(new MediaCropLoadError("load_failed"));
    });

    if (imageSrc.startsWith("blob:") || imageSrc.startsWith("data:")) {
      // Same-origin blob/data URL does not require crossOrigin attribute
    } else {
      image.setAttribute("crossOrigin", "anonymous");
    }

    image.src = imageSrc;
  });
}

export function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  fileName = "cropped-image.jpg"
): Promise<File> {
  const { image, cleanup } = await createImage(imageSrc);
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of the rotated image
    const bBoxWidth =
      Math.abs(Math.cos(rotRad) * image.width) +
      Math.abs(Math.sin(rotRad) * image.height);
    const bBoxHeight =
      Math.abs(Math.sin(rotRad) * image.width) +
      Math.abs(Math.cos(rotRad) * image.height);

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");

    if (!croppedCtx) {
      throw new Error("No 2d context for crop");
    }

    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return await new Promise<File>((resolve, reject) => {
      croppedCanvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const file = new File([blob], fileName, { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg", 0.95);
    });
  } finally {
    cleanup();
  }
}
