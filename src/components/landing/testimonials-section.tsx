import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

type Testimoninial = {
  name: string
  quote: string
  linkedIn?: string
  role?: string
  image?: string
}

const testimonials: Testimoninial[] = [
  {
    name: "Ifra Khan",
    image: "/testimonials/ifra-khan.png",
    quote:
      "Everything is explained clearly, with daily revision of previous topics. No matter how many times you ask, keogami explains patiently every time.",
  },
  {
    name: "Deepanshu Agarwal",
    role: "Backend Developer, Billfree Labs",
    linkedIn: "https://in.linkedin.com/in/deepanshu-agarwal-2a3825171",
    image: "/testimonials/deepanshu-agarwal.png",
    quote:
      "keogami has a rare ability to break down complex backend concepts into simple, practical steps. His mentorship improved not just my technical skills but my confidence in handling large-scale projects.",
  },
  {
    name: "Archit Kumar",
    role: "Senior Software Engineer, Bluelupin Technologies",
    linkedIn: "https://www.linkedin.com/in/archit-sde/",
    image: "/testimonials/archit-kumar.png",
    quote:
      "What sets keogami apart is how he ties every concept back to real-world, production-grade systems. Working with him sharpened my problem-solving and gave me the confidence to design scalable backends following industry best practices.",
  },
  {
    name: "Garima Jain",
    linkedIn: "https://www.linkedin.com/in/garima-jain-250346218",
    quote:
      "keogami's mentorship gave me the structure I needed to grow as a developer. His patient guidance and clear explanations made even the toughest concepts feel approachable.",
  },
  {
    name: "Sanyam Virmani",
    image: "/testimonials/sanyam-virmani.png",
    quote:
      "keogami taught me Python, HTML, and CSS, explaining everything simply and clearly. The small projects he assigned helped me apply what I learned and build real problem-solving skills. Highly recommend.",
  },
  {
    name: "Karoshi Nara",
    image: "/testimonials/karoshi-nara.png",
    role: "Assistant Professor, Kalka Institute",
    linkedIn: "https://www.linkedin.com/in/karoshinara",
    quote: "So, here's my unfiltered opinion on Mr. Keogami. He's a real good teacher when it comes to programming as he holds quite a lot of experience in various fields of programming. And his teaching methods and pace is really good. The best thing is that he adapts according to your learning speed and also forces you to improve yourself too. All & all, he's a real noice teacher."
  }
]

export function TestimonialsSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <h2 className="cli-prompt mb-12 text-center text-3xl font-bold">
        jq "." testimonials.json
      </h2>
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.name}>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src={t.image ?? "/placeholder-avatar.svg"}
                  alt={t.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{t.name}</span>
                    {t.linkedIn && (
                      <a
                        href={t.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t.name} on LinkedIn`}
                      >
                        <LinkedInIcon className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
                      </a>
                    )}
                  </div>
                  {t.role && (
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary text-lg font-bold">&ldquo;</span>
                {t.quote}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
