import { logger } from "@/lib/logger";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="not-found-page bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <style>{`

        .not-found-page {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
      <div className="text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-4 text-6xl md:text-8xl font-bold text-blue-600 dark:text-blue-400">404</h1>
          <p className="mb-6 text-xl md:text-2xl text-gray-700 dark:text-gray-300">Oops! Page not found</p>
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            Return to Home
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
