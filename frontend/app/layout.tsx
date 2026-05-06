import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "../src/styles/index.css";
import { VoiceBookingProvider } from "../src/context/VoiceBookingContext";
import { GlobalVoiceBooking } from "../src/app/components/GlobalVoiceBooking";

export const metadata: Metadata = {
  title: "Javis AI Hotel Booking",
  description: "AI hotel booking platform with voice booking assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <VoiceBookingProvider>
            {children}
            <GlobalVoiceBooking />
          </VoiceBookingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
