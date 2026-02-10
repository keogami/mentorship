import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "How do sessions work?",
    answer:
      "Sessions are 1:1 video calls scheduled through our platform. You can book a session for any available slot on the calendar. Each session typically lasts 30-60 minutes depending on what we're working on.",
  },
  {
    question: "What topics can I learn?",
    answer:
      "We cover a wide range of programming topics including web development, system design, algorithms, career guidance, code reviews, and project planning. The curriculum is personalized to your goals.",
  },
  {
    question: "How do I book a session?",
    answer:
      "After subscribing, you'll have access to my calendar where you can see available slots. Simply pick a time that works for you and book it. You can book up to 30 days in advance.",
  },
  {
    question: "What if I need to cancel a session?",
    answer:
      "You can cancel or reschedule a session anytime before it starts. Just go to your dashboard and manage your bookings. There's no penalty for cancellations.",
  },
  {
    question: "Is there a trial period?",
    answer:
      "Currently, we don't offer a trial period. However, you can cancel your subscription at any time if you feel it's not the right fit for you.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit/debit cards, UPI, and net banking through Razorpay. All payments are processed securely.",
  },
]

export function FAQSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <h2 className="cli-prompt mb-12 text-center text-3xl font-bold">
        faq
      </h2>
      <div className="mx-auto max-w-2xl">
        <Accordion type="single" collapsible>
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
