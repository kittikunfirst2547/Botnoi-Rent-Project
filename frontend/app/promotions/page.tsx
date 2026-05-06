import { Metadata } from "next";
import PromotionsPage from "../../src/app/components/PromotionsPage";

export const metadata: Metadata = {
  title: "โปรโมชัน — Javis AI Hotel Booking",
  description:
    "รวมโปรโมชันส่วนลดจากโรงแรมชั้นนำทั่วไทย ประหยัดสูงสุด 50% พร้อมสิทธิพิเศษมากมาย",
};

export default function Page() {
  return <PromotionsPage />;
}
