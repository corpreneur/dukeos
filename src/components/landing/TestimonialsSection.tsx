import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    location: "Frisco, TX",
    text: "I haven't thought about my backyard in months. The kids play out there every day and it's always spotless. The gate photo texts are such a nice touch.",
    rating: 5,
  },
  {
    name: "Jason R.",
    location: "Plano, TX",
    text: "Switched from another service — the difference is night and day. They suggested a mow when they noticed my grass was long. Booked it with one tap.",
    rating: 5,
  },
  {
    name: "Maria L.",
    location: "McKinney, TX",
    text: "Three dogs, two yards, zero stress. The subscription just works. I get a photo after every visit showing the gate is locked. Game changer.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="bg-muted/50 py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            Testimonials
          </span>
          <h2 className="mb-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Loved by <span className="text-gradient">Pet Parents</span>
          </h2>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-card-foreground">"{t.text}"</p>
              <div>
                <p className="font-display text-sm font-bold text-card-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
