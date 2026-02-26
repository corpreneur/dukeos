import { motion } from "framer-motion";
import { Route, Camera, MessageSquare, Shield, Zap, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Route,
    title: "Autonomous Routing",
    description: "AI builds the most efficient routes in real-time, maximizing stops per mile and minimizing drive time.",
    tag: "Core AI",
  },
  {
    icon: Camera,
    title: "Proof of Scoop™",
    description: "Photo-verified gate closure and service completion. Computer vision ensures your yard is secure.",
    tag: "Visual QA",
  },
  {
    icon: MessageSquare,
    title: "Yard Watch Upsells",
    description: "Techs spot issues, AI drafts the offer. \"Noticed the lawn is long — mow Thursday for $45?\"",
    tag: "Revenue AI",
  },
  {
    icon: Shield,
    title: "Zero Liability",
    description: "GPS + timestamp + device ID on every photo. Instant dispute resolution with visual proof.",
    tag: "Trust",
  },
  {
    icon: Zap,
    title: "Density Pricing",
    description: "Green zone? Aggressive pricing. Red zone? Premium rates. The AI optimizes margin automatically.",
    tag: "Pricing",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Dashboard",
    description: "Track every route, every tech, every dollar. Live KPIs: revenue, jobs completed, customer churn.",
    tag: "Analytics",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section className="relative bg-background py-24" id="features">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            Platform Features
          </span>
          <h2 className="mb-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Not Just Software. <span className="text-gradient">An Operating System.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            DukeOS replaces generic field service tools with purpose-built AI that thinks, routes, and sells autonomously.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex rounded-xl bg-accent p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-primary">
                {feature.tag}
              </span>
              <h3 className="mb-2 font-display text-xl font-bold text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
              {/* Hover glow */}
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
