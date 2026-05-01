import Link from "next/link";
import { Star, MapPin, Wifi, Coffee, Waves, ArrowUpRight } from "lucide-react";

interface HotelCardProps {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  imageUrl: string;
  amenities: string[];
  onBook: (hotelId: string) => void;
}

export function HotelCard({
  id,
  name,
  location,
  rating,
  reviews,
  price,
  imageUrl,
  amenities,
  onBook,
}: HotelCardProps) {
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-3 w-3" />;
      case "breakfast":
        return <Coffee className="h-3 w-3" />;
      case "pool":
        return <Waves className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-white/[0.03]">
      {/* Image — clickable */}
      <Link href={`/hotel/${id}`} className="relative block h-56 overflow-hidden bg-[var(--muted)]">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm dark:bg-black/60">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-[var(--foreground)]">{rating}</span>
        </div>
        {/* View detail hint */}
        <div className="absolute bottom-3 right-3 flex h-8 w-8 translate-y-2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-black/60">
          <ArrowUpRight className="h-4 w-4 text-[var(--foreground)]" />
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        <Link href={`/hotel/${id}`} className="no-underline">
          <h3
            className="mb-1 text-base font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--accent-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {name}
          </h3>
        </Link>
        <div className="mb-3.5 flex items-center gap-1.5 text-[var(--muted-foreground)]">
          <MapPin className="h-3.5 w-3.5" />
          <span className="text-xs">{location}</span>
          <span className="text-xs">•</span>
          <span className="text-xs">{reviews.toLocaleString()} รีวิว</span>
        </div>

        {/* Amenities */}
        <div className="mb-5 flex items-center gap-1.5">
          {amenities.map((amenity, index) => (
            <div
              key={index}
              className="flex items-center gap-1 rounded-md bg-[var(--muted)] px-2 py-1 text-[var(--muted-foreground)] transition-colors"
            >
              {getAmenityIcon(amenity)}
              <span className="text-[11px]">{amenity}</span>
            </div>
          ))}
        </div>

        {/* Price + Book */}
        <div className="flex items-end justify-between border-t border-[var(--border)] pt-4">
          <div>
            <p className="text-[11px] text-[var(--muted-foreground)]">เริ่มต้นที่</p>
            <div className="flex items-baseline gap-0.5">
              <span
                className="text-xl font-semibold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ฿{price.toLocaleString()}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">/คืน</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onBook(id);
            }}
            className="rounded-lg bg-[var(--accent-brand)] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--accent-brand-hover)] active:scale-[0.97]"
          >
            จองเลย
          </button>
        </div>
      </div>
    </div>
  );
}
