export interface AvatarPixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read image"));
    image.src = source;
  });
}

export async function createAvatarFile(
  source: string,
  crop: AvatarPixelCrop,
  rotation: number,
): Promise<File> {
  const image = await loadImage(source);
  const angle = (rotation * Math.PI) / 180;
  const rotatedWidth = Math.abs(Math.cos(angle) * image.width) + Math.abs(Math.sin(angle) * image.height);
  const rotatedHeight = Math.abs(Math.sin(angle) * image.width) + Math.abs(Math.cos(angle) * image.height);

  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = Math.ceil(rotatedWidth);
  rotatedCanvas.height = Math.ceil(rotatedHeight);
  const rotatedContext = rotatedCanvas.getContext("2d");
  if (!rotatedContext) throw new Error("Unable to prepare image");

  rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
  rotatedContext.rotate(angle);
  rotatedContext.translate(-image.width / 2, -image.height / 2);
  rotatedContext.drawImage(image, 0, 0);

  const outputSize = Math.min(1024, Math.max(crop.width, crop.height));
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) throw new Error("Unable to create image preview");

  outputContext.drawImage(
    rotatedCanvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Unable to create image preview"))),
      "image/jpeg",
      0.9,
    );
  });

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
