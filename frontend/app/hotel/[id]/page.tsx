import { notFound } from "next/navigation";
import { getHotelById, hotels } from "../../../src/data/hotels";
import HotelDetailClient from "./HotelDetailClient";

export async function generateStaticParams() {
  return hotels.map((hotel) => ({ id: hotel.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hotel = getHotelById(id);
  if (!hotel) return { title: "Hotel Not Found" };
  return {
    title: `${hotel.name} — Javis AI Hotel Booking`,
    description: hotel.description,
  };
}

export default async function HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hotel = getHotelById(id);
  if (!hotel) notFound();
  return <HotelDetailClient hotel={hotel} />;
}
