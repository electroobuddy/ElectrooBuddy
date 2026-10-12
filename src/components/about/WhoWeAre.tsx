import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export const WhoWeAre = () => {
  return (
    <section className="who-section">
      <div className="container mx-auto px-4">
        <motion.div
          className="who-inner"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="section-label">Who We Are</div>
          <div className="who-divider" />
          <p className="who-text">
            Electroobuddy is a leading electrical services company dedicated to providing top-notch electrical solutions for residential, commercial, and industrial clients. With over {new Date().getFullYear() - 1992} years of experience and a team of certified master electricians, we deliver safe, reliable, and cost-effective services that exceed expectations.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
