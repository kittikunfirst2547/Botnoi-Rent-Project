"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface VoiceBookingState {
  isOpen: boolean;
  hotelName: string;
  price: number;
}

interface VoiceBookingContextType {
  isOpen: boolean;
  hotelName: string;
  price: number;
  openVoiceBooking: (hotelName: string, price: number) => void;
  closeVoiceBooking: () => void;
}

const VoiceBookingContext = createContext<VoiceBookingContextType | null>(null);

export function VoiceBookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VoiceBookingState>({
    isOpen: false,
    hotelName: "",
    price: 0,
  });

  const openVoiceBooking = useCallback((hotelName: string, price: number) => {
    setState({
      isOpen: true,
      hotelName,
      price,
    });
  }, []);

  const closeVoiceBooking = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return (
    <VoiceBookingContext.Provider
      value={{
        isOpen: state.isOpen,
        hotelName: state.hotelName,
        price: state.price,
        openVoiceBooking,
        closeVoiceBooking,
      }}
    >
      {children}
    </VoiceBookingContext.Provider>
  );
}

export function useVoiceBooking() {
  const context = useContext(VoiceBookingContext);
  if (!context) {
    throw new Error("useVoiceBooking must be used within VoiceBookingProvider");
  }
  return context;
}
