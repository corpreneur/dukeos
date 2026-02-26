import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-hero py-24">
      <div className="absolute inset-0 bg-glow" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(189 91% 46%) 1px, transparent 1px), linear-gradient(90deg, hsl(189 91% 46%) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-6 font-display text-4xl font-bold text-primary-foreground md:text-5xl">
            Ready for a <span className="text-gradient">Spotless Yard</span>?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-primary-foreground/70">
            Join hundreds of DFW families who never think about yard cleanup again. Get your instant quote in 30 seconds.
          </p>
          <Button variant="hero" size="lg" className="h-14 rounded-xl px-10 text-base animate-pulse-glow" onClick={() => navigate("/auth?signup=true")}>
            Get Your Free Quote <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
