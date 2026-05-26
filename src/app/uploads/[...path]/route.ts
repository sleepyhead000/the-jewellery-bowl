import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, normalize } from "path";

const UPLOAD_ROOT = join(process.cwd(), "uploads");

const getContentType = (filePath: string): string => {
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".gif")) return "image/gif";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!Array.isArray(path) || path.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const relativePath = normalize(path.join("/")).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = join(UPLOAD_ROOT, relativePath);
  const normalizedRoot = normalize(UPLOAD_ROOT);
  const normalizedAbsolute = normalize(absolutePath);

  if (!normalizedAbsolute.startsWith(normalizedRoot)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const buffer = await readFile(normalizedAbsolute);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getContentType(normalizedAbsolute),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
