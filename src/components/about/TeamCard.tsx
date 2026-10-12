import { motion } from "framer-motion";
import team1 from "@/images/team-1.png";
import team2 from "@/images/dilip.jpeg";
import team3 from "@/images/no-profile.png";

interface TeamCardProps {
  member: {
    id: string;
    name: string;
    role: string;
    bio: string;
    photo_url?: string | null;
  };
  index: number;
}

const localTeamImages: Record<string, string> = {
  "Dilip Parihar": team2,
  "Viraj Parihar": team1,
  "Karan Parihar": team3,
  "Mr. Dilip Parihar": team2,
  "Mr. Viraj Parihar": team1,
  "Mr. Karan Parihar": team3,
};

export const getTeamImage = (name: string, photoUrl: string | null) => {
  if (photoUrl) return photoUrl;
  return localTeamImages[name] ?? team3;
};

const fadeInUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5 }
});

export const TeamCard = ({ member, index }: TeamCardProps) => {
  const imageUrl = getTeamImage(member.name, member.photo_url ?? null);

  return (
    <motion.article
      className="team-card"
      role="article"
      aria-label={`Team member: ${member.name}, ${member.role}`}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={fadeInUp(index * 0.1)}
    >
      <div className="team-avatar">
        <div className="avatar-ring" />
        <div className="avatar-inner">
          <img
            src={imageUrl}
            alt={member.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              const fallback = localTeamImages[member.name] ?? team3;
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
          />
        </div>
      </div>
      <div className="team-name">{member.name}</div>
      <div className="team-role">{member.role}</div>
      <p className="team-bio">{member.bio}</p>
    </motion.article>
  );
};
