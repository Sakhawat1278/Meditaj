import CurateHero from "@/components/Home/CurateHero";
import CurateBookingGateway from "@/components/Home/CurateBookingGateway";
import CurateServices from "@/components/Home/CurateServices";
import CurateDiseases from "@/components/Home/CurateDiseases";
import CurateCategories from "@/components/Home/CurateCategories";

export const metadata = {
  title: "Meditaj | Advanced Healthcare Ecosystem",
  description: "Experience the future of clinical diagnosis and specialist healthcare.",
};


export default function Home() {
  return (
    <main className="min-h-screen bg-white pt-[88px]">
      <CurateHero />
      <CurateBookingGateway />
      <CurateServices />
      <CurateDiseases />
      <CurateCategories />
    </main>
  );
}
