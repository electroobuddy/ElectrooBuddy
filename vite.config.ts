import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const localApiOrigin = env.API_PROXY_TARGET || "http://localhost:3001";
  return {
    base: "/",
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api/v1": {
          target: localApiOrigin,
          changeOrigin: true,
        },
      },
      hmr: { overlay: false },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: { alias: { "@": path.resolve(__dirname, "./src") }, dedupe: ["react", "react-dom"] },
    build: {
      minify: "esbuild",
      target: "esnext",
      cssMinify: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select"],
            "animation-vendor": ["framer-motion"],
            "charts-vendor": ["recharts"],
            "utils-vendor": ["@tanstack/react-query", "class-variance-authority", "clsx", "tailwind-merge"],
          },
          entryFileNames: "assets/[name].[hash].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash][extname]",
        },
      },
      chunkSizeWarningLimit: 650,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "framer-motion", "@tanstack/react-query"],
      exclude: ["lucide-react"],
    },
  };
});
