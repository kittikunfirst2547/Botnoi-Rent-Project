"use client";

import { useState } from "react";
import { BookingModal } from "./BookingModal";
import { VoiceBookingCallModal } from "./VoiceBookingCallModal";
import { useVoiceBooking } from "../../context/VoiceBookingContext";

export function GlobalVoiceBooking() {
  const { isOpen, hotelName, price, closeVoiceBooking } = useVoiceBooking();
  const [paymentBooking, setPaymentBooking] = useState<any>(null);

  return (
    <>
      <VoiceBookingCallModal
        isOpen={isOpen}
        hotelName={hotelName}
        price={price}
        onClose={closeVoiceBooking}
        onPaymentRequired={(booking) => setPaymentBooking(booking)}
      />
      <BookingModal
        isOpen={Boolean(paymentBooking)}
        hotelName={hotelName}
        price={price}
        initialBooking={paymentBooking}
        onClose={() => setPaymentBooking(null)}
      />
    </>
  );
}
