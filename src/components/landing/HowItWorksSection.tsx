import { motion } from "framer-motion";
import { MapPin, Camera, CheckCircle, CreditCard } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    step: "01",
    title: "Enter Your Address",
    description: "Our density engine checks your zone and gives you an instant price — no calls, no waiting.",
  },
  {
    icon: CreditCard,
    step: "02",
    title: "Pick a Plan",
    description: "Choose weekly or twice-weekly scooping. Add dog walking or grooming. One subscription, all services.",
  },
  {
    icon: Camera,
    step: "03",
    title: "We Show Up & Prove It",
    description: "Our tech arrives, scoops, photographs the latched gate, and you get a notification. Done.",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Sit Back & Relax",
    description: "AI monitors your yard, suggests add-ons, and auto-bills monthly. You never think about it again.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="bg-muted/50 py-24" id="how-it-works">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            How It Works
          </span>
          <h2 className="mb-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Clean Yard in <span className="text-gradient">4 Simple Steps</span>
          </h2>
        </motion.div>

        <div className="relative mx-auto max-w-4xl">
          {/* Connecting line */}
          <div className="absolute left-8 top-0 hidden h-full w-px bg-border md:left-1/2 md:block" />

          <div className="space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`flex items-center gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className={`flex-1 rounded-2xl border border-border bg-card p-8 shadow-sm ${i % 2 === 0 ? "md:text-right" : ""}`}>
                  <span className="mb-2 block font-display text-sm font-bold text-primary">
                    Step {step.step}
                  </span>
                  <h3 className="mb-2 font-display text-2xl font-bold text-card-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                <div className="relative z-10 hidden flex-shrink-0 md:block">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary shadow-glow">
                    <step.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                </div>
                <div className="hidden flex-1 md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
