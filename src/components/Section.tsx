import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

const Section = ({ children, className = "", id }: SectionProps) => (
  <>
    <style>{`
      .section-root {
        padding-top: 3rem;
        padding-bottom: 3rem;
        min-height: auto;
      }

      @media (min-width: 480px) {
        .section-root {
          padding-top: 3.5rem;
          padding-bottom: 3.5rem;
        }
      }

      @media (min-width: 640px) {
        .section-root {
          padding-top: 4rem;
          padding-bottom: 4rem;
        }
      }

      @media (min-width: 768px) {
        .section-root {
          padding-top: 5rem;
          padding-bottom: 5rem;
        }
      }

      @media (min-width: 1024px) {
        .section-root {
          padding-top: 6rem;
          padding-bottom: 6rem;
        }
      }

      @media (min-width: 1280px) {
        .section-root {
          padding-top: 7rem;
          padding-bottom: 7rem;
        }
      }

      .section-container {
        width: 100%;
        max-width: 1280px;
        margin-left: auto;
        margin-right: auto;
        padding-left: 1rem;
        padding-right: 1rem;
      }

      @media (min-width: 480px) {
        .section-container {
          padding-left: 1.25rem;
          padding-right: 1.25rem;
        }
      }

      @media (min-width: 640px) {
        .section-container {
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }
      }

      @media (min-width: 768px) {
        .section-container {
          padding-left: 2rem;
          padding-right: 2rem;
        }
      }

      @media (min-width: 1024px) {
        .section-container {
          padding-left: 2.5rem;
          padding-right: 2.5rem;
        }
      }

      @media (min-width: 1280px) {
        .section-container {
          padding-left: 3rem;
          padding-right: 3rem;
        }
      }
    `}</style>
    
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="section-root"
      style={{ background: "hsl(var(--background))", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className={`section-container ${className}`}>{children}</div>
    </motion.section>
  </>
);

export default Section;