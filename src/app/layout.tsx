import type { Metadata } from "next";
import { Roboto_Condensed, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Jewellery Bowl | The Art of Elegance",
  description: "Luxury Phone Covers, Gadgets & Accessories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoCondensed.variable} ${inter.variable} antialiased flex flex-col min-h-screen`}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
