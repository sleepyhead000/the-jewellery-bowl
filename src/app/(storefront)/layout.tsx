import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import MobileBottomNav from "@/components/storefront/MobileBottomNav";
import { CartProvider } from "@/hooks/use-cart";
import { Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({
    subsets: ["latin"],
    weight: ["400", "600"],
    variable: "--font-cormorant",
    display: "swap",
});

export default async function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <div
                className={`${cormorant.variable} flex flex-col min-h-screen`}
                style={{ background: "#0d0d0d" }}
            >
                <Header />
                <main className="flex-grow pb-16">{children}</main>
                <Footer />
                <MobileBottomNav />
            </div>
        </CartProvider>
    );
}
