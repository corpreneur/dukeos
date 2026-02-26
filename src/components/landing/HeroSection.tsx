import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-hero">
      {/* Glow overlay */}
      <div className="absolute inset-0 bg-glow" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(189 91% 46%) 1px, transparent 1px), linear-gradient(90deg, hsl(189 91% 46%) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="container relative z-10 mx-auto flex min-h-[90vh] flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Now Serving DFW North
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="mb-6 max-w-4xl text-center font-display text-5xl font-bold leading-tight tracking-tight text-primary-foreground md:text-7xl"
        >
          The Operating System{" "}
          <span className="text-gradient">for Your Yard</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mb-10 max-w-2xl text-center text-lg text-primary-foreground/70 md:text-xl"
        >
          AI-powered poop scooping, dog walking, and yard care — all in one subscription.
          Set it and forget it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex w-full max-w-lg flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter your address for an instant quote"
              className="h-14 w-full rounded-xl border-0 bg-card pl-12 pr-4 text-card-foreground shadow-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button variant="hero" size="lg" className="h-14 rounded-xl px-8 text-base" onClick={() => navigate("/auth?signup=true")}>
            Get Quote <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-4 text-sm text-primary-foreground/40"
        >
          Starting at $18/visit · No contracts · Cancel anytime
        </motion.p>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="mt-16 w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl"
        >
          <img
            src={heroImage}
            alt="Happy dog playing in a clean, well-maintained backyard"
            className="h-auto w-full object-cover"
            loading="eager"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
