import { NextRequest } from "next/server";
import { processAndSaveImage, validateFile } from "@/lib/upload";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";

export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `upload:${userId ?? "anon"}`,
    rateLimitMax: 30,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return validationError(context.requestId, "No files provided");
  }

  const results = [];
  const errors = [];

  for (const file of files) {
    const fileValidationError = validateFile(file);
    if (fileValidationError) {
      errors.push({ name: file.name, error: fileValidationError });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processAndSaveImage(buffer, file.name);
    results.push(result);
  }

  return withRequestId(context.requestId, { uploaded: results, errors });
}
