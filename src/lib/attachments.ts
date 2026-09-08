import { ApiError } from "./api";
export function decodeImage(url: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(url);
  if (!match) throw new ApiError(400, "Use PNG, JPEG or WebP images");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 1024 * 1024 || bytes.length < 12) throw new ApiError(400, "Each image must be between 12 bytes and 1 MB");
  const mime = match[1];
  const valid = mime === "image/png" ? bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
    : mime === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (!valid) throw new ApiError(400, "The file content does not match its image type");
  return { mime, bytes };
}
export function validateImages(images: string[]) { images.forEach(decodeImage); }
export function imageLinks<T extends { id: string }>(images: T[]) { return images.map(i => ({ ...i, url: `/api/attachments/${i.id}` })); }
