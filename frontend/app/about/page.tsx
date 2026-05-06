import { Metadata } from "next";
import AboutPage from "../../src/app/components/AboutPage";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา — Javis AI Hotel Booking",
  description:
    "Javis คือแพลตฟอร์มจองโรงแรมที่ขับเคลื่อนด้วย AI เพื่อให้คุณค้นหาที่พักที่ใช่ได้ง่ายและรวดเร็วที่สุด",
};

export default function Page() {
  return <AboutPage />;
}
