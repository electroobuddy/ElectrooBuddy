import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const fadeInUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 }
});

const perks = [
  "Licensed & insured professionals",
  "Transparent, upfront pricing",
  "24/7 emergency support",
  "Quality materials & workmanship",
  "100% satisfaction guarantee",
  "On-time service delivery",
];

export const Perks = () => {
  return (
    <section className="perks-section">
      <div className=" px-4">
        <div className="text-center mb-12">
          <div className="section-label">Why Us</div>
          <div className="section-title">Why Choose <span>Electroobuddy?</span></div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {perks.map((item, i) => (
            <motion.div
              key={item}
              className="perk-item"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp(i * 0.07)}
            >
              <div className="perk-check"><CheckCircle size={14} /></div>
              <span className="perk-text">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
