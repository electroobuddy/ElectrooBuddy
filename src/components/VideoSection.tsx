import { motion } from "framer-motion";
import { Play, Zap } from "lucide-react";
import { useState } from "react";

const VideoSection = () => {
  const [playing, setPlaying] = useState<number | null>(null);

  const videos = [
    { id: 1, title: 'AC Installation Process', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', videoId: 'dQw4w9WgXcQ' },
    { id: 2, title: 'TV Wall Mounting', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', videoId: 'dQw4w9WgXcQ' },
    { id: 3, title: 'Electrical Repair', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', videoId: 'dQw4w9WgXcQ' },
    { id: 4, title: 'DTH Setup Guide', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', videoId: 'dQw4w9WgXcQ' },
    { id: 5, title: 'Fan Installation', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', videoId: 'dQw4w9WgXcQ' },
    { id: 6, title: 'Appliance Maintenance', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', videoId: 'dQw4w9WgXcQ' },
  ];

  return (
    <section className="relative py-24 overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, hsl(var(--primary) / 0.08), transparent)",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: "hsl(var(--primary) / 0.1)",
              border: "1px solid hsl(var(--primary) / 0.2)",
              color: "hsl(var(--primary))",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase" as const,
            }}
          >
            <Zap size={14} />
            See Us In Action
          </div>

          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              textTransform: "uppercase" as const,
              color: "hsl(var(--foreground))",
              lineHeight: 1.1,
              marginBottom: "16px",
            }}
          >
            Watch How We <span style={{ color: "hsl(var(--primary))" }}>Power</span> Your Home
          </h2>

          <p
            style={{
              maxWidth: "560px",
              margin: "0 auto",
              color: "hsl(var(--muted-foreground))",
              fontSize: "16px",
              lineHeight: 1.7,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            From complex installations to quick repairs — see the quality, speed, and professionalism that sets Electroobuddy apart.
          </p>
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div
                className="relative rounded-xl overflow-hidden group cursor-pointer"
                style={{
                  aspectRatio: "16/9",
                  background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted)))",
                  border: "1px solid hsl(var(--border) / 0.5)",
                  boxShadow: playing === video.id 
                    ? "0 25px 80px hsl(var(--primary) / 0.25), 0 10px 30px hsl(var(--foreground) / 0.12)" 
                    : "0 10px 30px hsl(var(--foreground) / 0.08)",
                }}
                onClick={() => setPlaying(playing === video.id ? null : video.id)}
              >
                {playing === video.id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
                    title={video.title}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    style={{ border: "none" }}
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center group-hover:bg-opacity-90 transition-all duration-300"
                    style={{
                      background: `url(${video.thumbnail}) center/cover`,
                    }}
                  >
                    {/* Overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(135deg, rgba(30, 64, 175, 0.7), rgba(59, 130, 246, 0.6))",
                      }}
                    />

                    {/* Play button */}
                    <motion.div
                      className="relative z-10"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: "64px",
                          height: "64px",
                          background: "linear-gradient(135deg, hsl(var(--primary)), #1e40af)",
                          boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
                        }}
                      >
                        <Play size={24} fill="white" color="white" style={{ marginLeft: "2px" }} />
                      </div>
                    </motion.div>

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2">{video.title}</h3>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
