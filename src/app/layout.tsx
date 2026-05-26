import type { Metadata } from "next";
import { Roboto_Condensed, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const THEME_BOOT_SCRIPT = `
  (function() {
    try {
      var mode = localStorage.getItem("theme_mode");
      var safeMode = mode === "dark" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", safeMode);
    } catch (error) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  })();
`;

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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body
        className={`${robotoCondensed.variable} ${inter.variable} antialiased flex flex-col min-h-screen`}
      >
        <ThemeProvider>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
