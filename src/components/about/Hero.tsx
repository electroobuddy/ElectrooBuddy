import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay: 0.2, duration: 0.4 }
};

const textFadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6 }
});

export const Hero = () => {
  return (
    <section className="hero-gradient text-white about-hero slide-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <motion.div
            variants={scaleIn}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8"
          >
            <Zap className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wide">About Electroo Buddy</span>
          </motion.div>

          <motion.h1
            variants={textFadeIn(0.3)}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          >
            Serving Ujjain Since 1992
          </motion.h1>

          <motion.p
            variants={textFadeIn(0.4)}
            className="text-xl max-w-3xl mx-auto opacity-90"
          >
            Your trusted partner for professional electrical services with over {new Date().getFullYear() - 1992} years of experience in Ujjain
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
