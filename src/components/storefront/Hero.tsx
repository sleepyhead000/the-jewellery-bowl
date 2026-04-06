import Image from "next/image";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative w-full h-[70svh] md:h-[80vh] overflow-hidden flex flex-col items-center justify-center text-center">
            {/* Background Image */}
            <Image
                src="https://placehold.co/1920x1080/0a0a0a/0a0a0a?text=+"
                alt="Luxury lifestyle"
                fill
                priority
                className="object-cover"
                sizes="100vw"
            />

            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/50 z-[1]" />

            <div className="relative z-10 space-y-6 md:space-y-8 px-4 max-w-3xl">
                <p className="text-xs md:text-sm tracking-[0.4em] text-white/70 uppercase animate-fade-in-up font-body">
                    Curated Luxury Accessories
                </p>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white uppercase animate-fade-in-up-delay font-display">
                    TN Luxury
                </h1>
                <p className="text-base md:text-lg font-light tracking-wide text-white/80 max-w-md mx-auto animate-fade-in-up-delay font-body">
                    Premium phone cases, eyewear, bags & accessories — crafted for those who appreciate the finer things.
                </p>
                <div className="animate-fade-in-up-delay-2">
                    <Link
                        href="/products"
                        className="inline-block bg-white/10 backdrop-blur-md text-white border border-white/30 px-10 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300"
                    >
                        Shop Collection
                    </Link>
                </div>
            </div>

            {/* Bottom gradient fade into page */}
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>
    );
}
