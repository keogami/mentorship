import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = [
  {
    title: "Daily Sessions",
    description:
      "Book a 1:1 session every single day. No limits on how fast you can learn.",
  },
  {
    title: "Direct Access",
    description:
      "Get your questions answered quickly. No waiting for office hours.",
  },
  {
    title: "Personalized Path",
    description:
      "Your learning path is tailored to your goals and current skill level.",
  },
  {
    title: "Real Projects",
    description:
      "Build portfolio-worthy projects with guidance from an experienced developer.",
  },
]

export function ValuePropSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <h2 className="cli-prompt mb-12 text-center text-3xl font-bold">
        why mentorship
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
