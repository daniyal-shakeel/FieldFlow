import { PricingSection } from '@/components/Pricing/PricingSection';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header';

export default function PricingPage() {
  return (
    <div className="h-screen overflow-y-auto flex flex-col font-sans transition-colors duration-300 bg-canvas text-ink">
      <Header />


      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-24 pb-16">
        <PricingSection />
        <Footer />
      </main>
    </div>
  );
}
