
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Section from "@/components/Section";
import { Zap, FolderOpen, Loader2, Sun, Moon } from "lucide-react";
import { useProjects } from "@/hooks/useOptimizedData";
import PublicApiState from "@/components/PublicApiState";

const Projects = () => {
  const [active, setActive] = useState("All");
  // Use optimized hook with caching instead of direct backend queries
  const { projects, loading, error, refetch } = useProjects();
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode effect
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' || 
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', String(!darkMode));
  };

  const categories = ["All", ...new Set(projects.map((p) => p.category))];
  const filtered = active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <div className="projects-page bg-gray-50 dark:bg-gray-900 min-h-screen">
      <style>{`

        .projects-page {
          font-family: 'Poppins', sans-serif;
        }

        .projects-page h1,
        .projects-page h2,
        .projects-page h3,
        .projects-page h4,
        .projects-page h5,
        .projects-page h6 {
          font-weight: 700;
        }

        .projects-hero {
          position: relative;
          padding: 112px 0 96px;
          overflow: hidden;
          text-align: center;
        }

        /* Filter Pills */
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-bottom: 52px;
        }

        .filter-pill {
          padding: 9px 22px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.3px;
          cursor: pointer;
          border: 1px solid rgba(59, 130, 246, 0.2);
          background: rgba(59, 130, 246, 0.05);
          color: #6b7280;
          transition: all 0.25s ease;
          outline: none;
        }

        .dark .filter-pill {
          background: rgba(59, 130, 246, 0.1);
          color: #9ca3af;
          border-color: rgba(59, 130, 246, 0.3);
        }

        .filter-pill:hover {
          border-color: rgba(59, 130, 246, 0.5);
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .filter-pill.active {
          background: linear-gradient(135deg, #3b82f6, #1e3a8a);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 4px 16px rgba(59, 130, 246, 0.2);
        }

        /* Project Cards */
        .project-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .dark .project-card {
          background: #1f2937;
          border-color: #374151;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .project-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .project-card:hover {
          transform: translateY(-6px);
          border-color: #3b82f6;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.1), 0 0 40px rgba(59, 130, 246, 0.1);
        }

        .dark .project-card:hover {
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(59, 130, 246, 0.2);
        }

        .project-card:hover::after { opacity: 1; }

        .card-thumb {
          position: relative;
          height: 200px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .dark .card-thumb {
          background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
        }

        .thumb-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }

        .thumb-icon-wrap {
          position: relative;
          z-index: 2;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 1px solid rgba(59, 130, 246, 0.2);
          background: rgba(59, 130, 246, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s ease;
        }

        .project-card:hover .thumb-icon-wrap {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
          transform: scale(1.1);
        }

        .thumb-folder {
          width: 32px;
          height: 32px;
          color: #9ca3af;
          transition: color 0.4s;
        }

        .project-card:hover .thumb-folder { color: #3b82f6; }

        .thumb-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 60%, rgba(255, 255, 255, 0.8));
        }

        .dark .thumb-overlay {
          background: linear-gradient(to bottom, transparent 60%, rgba(31, 41, 55, 0.8));
        }

        .card-body {
          padding: 22px 24px 26px;
        }

        .card-category {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
          margin-bottom: 12px;
        }

        .card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #1e3a8a;
          line-height: 1.2;
          margin-bottom: 8px;
        }

        .dark .card-title {
          color: #60a5fa;
        }

        .card-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.65;
        }

        .dark .card-desc {
          color: #9ca3af;
        }

        .card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(59, 130, 246, 0.2);
        }

        .dark .card-footer {
          border-top-color: rgba(59, 130, 246, 0.3);
        }

        .footer-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);
          flex-shrink: 0;
          animation: dotBlink 2s ease-in-out infinite;
        }

        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .footer-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .dark .footer-label {
          color: #9ca3af;
        }
      `}</style>

      {/* Dark Mode Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-24 right-4 z-50 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="w-6 h-6 text-yellow-500" />
        ) : (
          <Moon className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Hero */}
      {/* ── Hero ── */}
      <section className="hero-gradient text-white projects-hero slide-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8"
            >
              <Zap className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">Portfolio</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Our Projects
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl max-w-3xl mx-auto opacity-90"
            >
              Showcasing our finest electrical work across residential, commercial & industrial sectors
            </motion.p>
          </motion.div>
        </div>
      </section>

      <Section>
        {loading ? (
          <div className="flex justify-center py-16">
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
              <Loader2 className="animate-spin" size={22} style={{ color: "#3b82f6" }} />
              <span style={{ color: "#6b7280", fontSize: 14, fontFamily: "'Poppins', sans-serif" }}>Loading projects...</span>
            </div>
          </div>
        ) : error ? (
          <PublicApiState error={error} onRetry={refetch} errorMessage="We could not load projects from the API." />
        ) : projects.length === 0 ? (
          <PublicApiState empty emptyMessage="No projects are currently published." />
        ) : (
          <>
            {/* Filter pills */}
            <div className="filter-row">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`filter-pill ${active === c ? "active" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 32, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ delay: i * 0.07, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                    className="project-card"
                  >
                    <div className="card-thumb">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <div className="thumb-grid" />
                          <div className="thumb-icon-wrap">
                            <FolderOpen className="thumb-folder" />
                          </div>
                        </>
                      )}
                      <div className="thumb-overlay" />
                    </div>

                    <div className="card-body">
                      <div className="card-category">
                        <Zap size={9} />
                        {p.category}
                      </div>
                      <h3 className="card-title">{p.title}</h3>
                      <p className="card-desc">{p.description}</p>
                      <div className="card-footer">
                        <div className="footer-dot" />
                        <span className="footer-label">Completed</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </Section>
    </div>
  );
};

export default Projects;