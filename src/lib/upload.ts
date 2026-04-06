import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import sharp from "sharp";

const UPLOAD_DIR = join(process.cwd(), "uploads");

const SIZES = {
  thumbnail: { width: 200, height: 200 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
} as const;

export type ImageSize = keyof typeof SIZES;

interface UploadResult {
  filename: string;
  urls: Record<ImageSize, string>;
}

export async function processAndSaveImage(
  buffer: Buffer,
  originalName: string
): Promise<UploadResult> {
  const timestamp = Date.now();
  const ext = extname(originalName).toLowerCase();
  const baseName = `${timestamp}-${Math.random().toString(36).slice(2, 8)}`;

  // Ensure upload directories exist
  for (const size of Object.keys(SIZES) as ImageSize[]) {
    await mkdir(join(UPLOAD_DIR, size), { recursive: true });
  }

  const urls: Record<string, string> = {};

  for (const [sizeName, dimensions] of Object.entries(SIZES)) {
    const filename = `${baseName}-${sizeName}.webp`;
    const filepath = join(UPLOAD_DIR, sizeName, filename);

    await sharp(buffer)
      .resize(dimensions.width, dimensions.height, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    urls[sizeName] = `/uploads/${sizeName}/${filename}`;
  }

  // Also save original as webp
  const originalFilename = `${baseName}-original.webp`;
  await sharp(buffer)
    .webp({ quality: 90 })
    .toFile(join(UPLOAD_DIR, originalFilename));

  return {
    filename: `${baseName}${ext}`,
    urls: urls as Record<ImageSize, string>,
  };
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, WebP, and GIF images are allowed";
  }
  if (file.size > MAX_SIZE) {
    return "File size must be under 10MB";
  }
  return null;
}
