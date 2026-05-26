import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { validatePasswordStrength } from "@/lib/password";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/api-security";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^01[0-9]{9}$/),
  email: z.string().trim().email().optional().or(z.literal("")),
  password: z.string().min(10).max(128),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`auth:register:${ip}`, 5, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone, email, password } = parsed.data;
  const pwdError = validatePasswordStrength(password);
  if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });

  const finalEmail = email ? email.toLowerCase() : null;

  const [phoneExists, emailExists] = await Promise.all([
    db.user.findUnique({ where: { phone } }),
    finalEmail ? db.user.findUnique({ where: { email: finalEmail } }) : Promise.resolve(null),
  ]);

  if (phoneExists || emailExists) {
    console.warn("[register] duplicate identity attempted", {
      hasPhoneConflict: Boolean(phoneExists),
      hasEmailConflict: Boolean(emailExists),
      ip,
    });
    return NextResponse.json({ error: "Unable to register with provided details" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      name,
      phone,
      email: finalEmail,
      passwordHash,
      role: "CUSTOMER",
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
