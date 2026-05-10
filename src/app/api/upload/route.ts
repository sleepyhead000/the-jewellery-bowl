import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processAndSaveImage, validateFile } from "@/lib/upload";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limiter = await rateLimit(`upload:${session.user.id}`, 30, 300);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429, headers: rateLimitHeaders(limiter) });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const results = [];
  const errors = [];

  for (const file of files) {
    const validationError = validateFile(file);
    if (validationError) {
      errors.push({ name: file.name, error: validationError });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processAndSaveImage(buffer, file.name);
    results.push(result);
  }

  return NextResponse.json({ uploaded: results, errors });
}
