"use server";

import { db } from "@/lib/db";

export async function subscribeNewsletter(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    // Store subscription as a setting (could be a dedicated table in production)
    const key = `newsletter_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    await db.setting.upsert({
      where: { key },
      update: { value: JSON.stringify({ email: email.toLowerCase(), subscribedAt: new Date().toISOString() }) },
      create: { key, value: JSON.stringify({ email: email.toLowerCase(), subscribedAt: new Date().toISOString() }) },
    });

    return { success: "Welcome! Your 10% discount code is: WELCOME10" };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
