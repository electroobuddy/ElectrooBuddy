import { logger } from "@/lib/logger";
import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Sparkles, X, Copy, Check, Ticket } from "lucide-react";
import { listPublicOffers } from "@/lib/publicApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PublicApiState from "@/components/PublicApiState";

interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  banner_url: string | null;
  offer_type: string;
  value: number | null;
  min_purchase: number | null;
  max_discount: number | null;
  start_date: string;
  end_date: string | null;
  priority: number;
  visibility: string[];
  cta_text: string | null;
  cta_link: string | null;
  bg_gradient: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Memoized CountdownTimer to prevent unnecessary re-renders
const CountdownTimer = memo(({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const distance = new Date(expiresAt).getTime() - Date.now();
      if (distance <= 0) return null;
      return {
        h: Math.floor(distance / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculate());
    const timer = setInterval(() => {
      const remaining = calculate();
      setTimeLeft(remaining);
      if (!remaining) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!timeLeft) return null;

  return (
    <div className="hidden xs:flex items-center gap-1 font-mono text-[10px] sm:text-[11px] bg-black/20 px-2 py-0.5 rounded text-white border border-white/10 shrink-0">
      <span className="opacity-70 uppercase text-[8px] mr-1 font-sans font-bold hidden sm:inline">Ends in</span>
      <span>{String(timeLeft.h).padStart(2, '0')}</span>:
      <span>{String(timeLeft.m).padStart(2, '0')}</span>:
      <span>{String(timeLeft.s).padStart(2, '0')}</span>
    </div>
  );
});
CountdownTimer.displayName = 'CountdownTimer';

interface OfferBannerSliderProps {
  visibility?: "home_hero" | "products_page" | "popup";
}


// Memoized single offer slide component
const OfferSlide = memo(({ 
  offer, 
  onGrabOffer, 
  isCopied 
}: { 
  offer: Offer; 
  onGrabOffer: (offer: Offer) => void;
  isCopied: boolean;
}) => {
  // Memoize discount label calculation
  const discountLabel = useMemo(() => {
    if (!offer.value || offer.value <= 0) return null;
    return offer.offer_type === "percentage" 
      ? `${offer.value}% OFF` 
      : `₹${offer.value} OFF`;
  }, [offer.value, offer.offer_type]);

  const handleClick = useCallback(() => onGrabOffer(offer), [onGrabOffer, offer]);
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onGrabOffer(offer);
  }, [onGrabOffer, offer]);

  return (
    <div
      className="flex-[0_0_100%] min-w-0 relative cursor-pointer"
      onClick={handleClick}
    >
      {/* Per-slide gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${offer.bg_gradient || "from-blue-600 to-blue-800"}`}
      />

      {/* Strip content */}
      <div className="relative h-10 sm:h-11 flex items-center justify-center gap-2 sm:gap-4 px-10 sm:px-14">

        {/* ── Left: Offer badge ── */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          <Sparkles size={9} className="text-yellow-300" />
          Offer
        </div>

        {/* ── Centre: title + subtitle + discount ── */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Discount pill (always visible) */}
          {discountLabel && (
            <span className="shrink-0 rounded-full bg-yellow-400 px-2 py-0.5 text-[11px] font-extrabold text-yellow-900 leading-none">
              {discountLabel}
            </span>
          )}

          {/* Title */}
          <p className="text-white font-semibold text-sm sm:text-[13px] leading-none truncate max-w-[200px] sm:max-w-none">
            {offer.title}
          </p>

          {/* Separator + subtitle (hidden on xs) */}
          {offer.subtitle && (
            <>
              <span className="hidden sm:block h-3 w-px bg-white/30 shrink-0" />
              <p className="hidden sm:block text-white/80 text-[12px] leading-none truncate max-w-xs">
                {offer.subtitle}
              </p>
            </>
          )}

          {/* Description (visible md+) */}
          {offer.description && (
            <>
              <span className="hidden md:block h-3 w-px bg-white/30 shrink-0" />
              <p className="hidden md:block text-white/70 text-[11px] leading-none truncate max-w-sm">
                {offer.description}
              </p>
            </>
          )}
        </div>

        {/* ── Countdown Timer ── */}
        {offer.end_date && <CountdownTimer expiresAt={offer.end_date} />}

        {/* ── Right: CTA button ── */}
        <button
          onClick={handleButtonClick}
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50 transition-colors shadow group/btn"
        >
          {isCopied ? (
            <>
              <Check size={11} className="text-green-600" />
              Copied!
            </>
          ) : (
            <>
              {offer.cta_text || "Grab Offer"}
              <Copy size={11} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
});
OfferSlide.displayName = 'OfferSlide';

const OfferBannerSlider: React.FC<OfferBannerSliderProps> = memo(({ visibility = "home_hero" }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Autoplay plugin with pause on hover
  const autoplayPlugin = useMemo(() => 
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  []);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [autoplayPlugin]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => { 
      emblaApi.off("select", onSelect); 
      emblaApi.off("reInit", onSelect); 
    };
  }, [emblaApi, onSelect]);

  // Fetch offers with retry logic
  useEffect(() => {
    let isMounted = true;

    const fetchOffers = async () => {
      if (!isMounted) return;
      
      try {
        setError(null);
        const data = await listPublicOffers(visibility);
        if (isMounted) setOffers(data || []);
      } catch (err) {
        logger.error("Error fetching offers:", err);
        if (isMounted) {
          setOffers([]);
          setError(err instanceof Error ? err : new Error("Failed to load offers"));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOffers();
    return () => { isMounted = false; };
  }, [visibility, reloadKey]);

  // Memoized grab offer handler
  const handleGrabOffer = useCallback(async (offer: Offer) => {
    const offerCode = offer.title;

    try {
      await navigator.clipboard.writeText(offerCode);
      setCopiedId(offer.id);
      toast.success(`Offer code "${offerCode}" copied! Redirecting to booking...`);

      setTimeout(() => setCopiedId(null), 2000);

      setTimeout(() => {
        const serviceParam = offer.cta_link?.replace('/#request-service', '') || '';
        navigate(`/booking?offer=${encodeURIComponent(offerCode)}&service=${encodeURIComponent(serviceParam)}`);
      }, 500);
    } catch (err) {
      navigate(`/booking?offer=${encodeURIComponent(offerCode)}`);
    }
  }, [navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollPrev();
      if (e.key === 'ArrowRight') scrollNext();
      if (e.key === 'Escape') setDismissed(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollPrev, scrollNext]);

  // ── Skeleton: strip height only ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full h-10 sm:h-11 bg-gradient-to-r from-blue-600 to-blue-800 animate-pulse" />
    );
  }

  if (error && !dismissed) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-2">
        <PublicApiState compact error={error} onRetry={() => setReloadKey((value) => value + 1)} errorMessage="Offers could not be loaded." />
      </div>
    );
  }

  if (offers.length === 0 || dismissed) return null;

  const hasMultipleOffers = offers.length > 1;

  return (
    <div 
      className="relative w-full bg-blue-700 border-b border-white/10 overflow-hidden group"
      role="region"
      aria-label="Promotional offers"
    >
      {/* Embla viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {offers.map((offer) => (
            <OfferSlide 
              key={offer.id} 
              offer={offer} 
              onGrabOffer={handleGrabOffer}
              isCopied={copiedId === offer.id}
            />
          ))}
        </div>
      </div>

      {/* ── Prev / Next arrows ── */}
      {hasMultipleOffers && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
            onMouseEnter={() => autoplayPlugin.stop()}
            onMouseLeave={() => autoplayPlugin.play()}
            aria-label="Previous offer"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); scrollNext(); }}
            onMouseEnter={() => autoplayPlugin.stop()}
            onMouseLeave={() => autoplayPlugin.play()}
            aria-label="Next offer"
            className="absolute right-8 sm:right-9 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {hasMultipleOffers && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1 flex gap-1 z-10">
          {offers.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to offer ${i + 1}`}
              className={`h-1 rounded-full transition-all ${i === selectedIndex ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
            />
          ))}
        </div>
      )}

      {/* ── Dismiss button ── */}
      <button
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        aria-label="Close offers banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-5 w-5 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        <X size={12} />
      </button>
    </div>
  );
});

OfferBannerSlider.displayName = 'OfferBannerSlider';

export default OfferBannerSlider;