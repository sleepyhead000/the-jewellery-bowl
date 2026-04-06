import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import MobileBottomNav from "@/components/storefront/MobileBottomNav";
import { CartProvider } from "@/hooks/use-cart";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Header />
      <main className="flex-grow pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </CartProvider>
  );
}
