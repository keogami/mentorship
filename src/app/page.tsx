import { CTASection } from "@/components/landing/cta-section"
import { FAQSection } from "@/components/landing/faq-section"
import { HeroSection } from "@/components/landing/hero-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { ValuePropSection } from "@/components/landing/value-prop"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </>
  )
}
