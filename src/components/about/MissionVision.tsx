import { motion } from "framer-motion";
import { Target, Eye } from "lucide-react";

const fadeInSide = (direction: 'left' | 'right', delay: number) => ({
  initial: { opacity: 0, x: direction === 'left' ? -30 : 30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.55, delay }
});

const missionVisionData = [
  {
    icon: Target,
    title: "Our Mission",
    text: "To provide exceptional electrical services that prioritize safety, quality, and customer satisfaction while making professional electrical expertise accessible and affordable for everyone.",
    accent: "#2980c7ff",
    glow: "rgba(255,200,0,0.06)",
    num: "01",
  },
  {
    icon: Eye,
    title: "Our Vision",
    text: "To become the most trusted name in electrical services, known for innovation, reliability, and an unwavering commitment to excellence in every project we undertake.",
    accent: "#38bdf8",
    glow: "rgba(56,189,248,0.06)",
    num: "02",
  },
];

export const MissionVision = () => {
  return (
    <section className="mv-section">
      <div className=" px-4">
        <div className="text-center mb-12">
          <div className="section-label">Our Foundation</div>
          <div className="section-title">Mission & <span>Vision</span></div>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {missionVisionData.map((item, i) => (
            <motion.div
              key={item.title}
              className="mv-card"
              style={{ "--card-accent": item.accent, "--card-glow": item.glow } as React.CSSProperties}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInSide(i === 0 ? 'left' : 'right', i * 0.1)}
            >
              <div className="mv-card-bg-num">{item.num}</div>
              <div className="mv-icon-hex">
                <div className="hex-bg" />
                <div className="hex-icon"><item.icon size={22} /></div>
              </div>
              <div className="mv-title">{item.title}</div>
              <p className="mv-text">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
