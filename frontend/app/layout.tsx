import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "../src/styles/index.css";
import { VoiceBookingProvider } from "../src/context/VoiceBookingContext";
import { AuthProvider } from "../src/context/AuthContext";
import { GlobalVoiceBooking } from "../src/app/components/GlobalVoiceBooking";
import { AuthModal } from "../src/app/components/AuthModal";

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
          <AuthProvider>
            <VoiceBookingProvider>
              {children}
              <GlobalVoiceBooking />
              <AuthModal />
            </VoiceBookingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
