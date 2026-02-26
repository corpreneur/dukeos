import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Weekly Scoop",
    price: "$18",
    period: "/visit",
    description: "Perfect for single-dog homes in high-density zones.",
    features: [
      "Weekly yard scooping",
      "Proof of Scoop™ photos",
      "Gate latch verification",
      "Monthly auto-billing",
      "SMS service notifications",
    ],
    popular: false,
  },
  {
    name: "Twice Weekly",
    price: "$14",
    period: "/visit",
    description: "Our most popular plan. Cleanest yard on the block.",
    features: [
      "Twice-weekly scooping",
      "Proof of Scoop™ photos",
      "Gate latch verification",
      "Yard Watch AI monitoring",
      "Priority scheduling",
      "Multi-dog discount",
    ],
    popular: true,
  },
  {
    name: "Full Yard Care",
    price: "$35",
    period: "/visit",
    description: "Scooping + deodorize + yard watch for pristine properties.",
    features: [
      "Twice-weekly scooping",
      "Yard deodorizing treatment",
      "Full Yard Watch reports",
      "Lawn care add-on discounts",
      "Dedicated technician",
      "Priority support",
    ],
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section className="bg-background py-24" id="pricing">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            Pricing
          </span>
          <h2 className="mb-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            No contracts. No hidden fees. Cancel anytime.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative overflow-hidden rounded-2xl border p-8 ${
                plan.popular
                  ? "border-primary bg-card shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground">
                  MOST POPULAR
                </div>
              )}
              <h3 className="mb-2 font-display text-xl font-bold text-card-foreground">{plan.name}</h3>
              <p className="mb-6 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mb-6">
                <span className="font-display text-5xl font-bold text-card-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <Button
                variant={plan.popular ? "hero" : "hero-outline"}
                className="mb-8 w-full rounded-xl"
                size="lg"
              >
                Get Started
              </Button>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-card-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
