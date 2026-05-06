"use client";

import { VoiceBookingCallModal } from "./VoiceBookingCallModal";
import { useVoiceBooking } from "../../context/VoiceBookingContext";

export function GlobalVoiceBooking() {
  const { isOpen, hotelName, price, closeVoiceBooking } = useVoiceBooking();

  return (
    <VoiceBookingCallModal
      isOpen={isOpen}
      hotelName={hotelName}
      price={price}
      onClose={closeVoiceBooking}
    />
  );
}
