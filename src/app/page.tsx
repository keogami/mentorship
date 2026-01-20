import { HeroSection } from "@/components/landing/hero-section"
import { ValuePropSection } from "@/components/landing/value-prop"
import { PricingSection } from "@/components/landing/pricing-section"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  )
}
