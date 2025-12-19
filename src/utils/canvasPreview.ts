import { PixelCrop } from "react-image-crop";

const TO_RADIANS = Math.PI / 180;

/**
 * Draws a cropped preview of an image onto a canvas, with optional scale/rotation
 * and devicePixelRatio awareness for sharpness.
 */
export function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;
  const maxOutput = 2400;

  const rawWidth = crop.width * scaleX * pixelRatio;
  const rawHeight = crop.height * scaleY * pixelRatio;
  const downscale = Math.min(1, maxOutput / Math.max(rawWidth, rawHeight));
  const targetWidth = Math.floor(rawWidth * downscale);
  const targetHeight = Math.floor(rawHeight * downscale);

  canvas.width = Math.max(1, targetWidth);
  canvas.height = Math.max(1, targetHeight);

  ctx.scale(pixelRatio * downscale, pixelRatio * downscale);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const rotateRads = rotate * TO_RADIANS;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );
  ctx.restore();
}
