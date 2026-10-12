import { TeamCard } from "./TeamCard";
import PublicApiState from "@/components/PublicApiState";

interface TeamProps {
  members: any[];
  loading: boolean;
  error: unknown;
  onRetry?: () => void | Promise<void>;
}

export const Team = ({ members, loading, error, onRetry }: TeamProps) => {
  // Error state
  if (error) {
    return (
      <section className="team-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="section-label">The Experts</div>
            <div className="section-title">Our <span>Team</span></div>
          </div>
          <div className="max-w-2xl mx-auto py-6">
            <PublicApiState error={error} onRetry={onRetry} errorMessage="We could not load team members from the API." />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="team-section">
      <div className=" px-4">
        <div className="text-center mb-12">
          <div className="section-label">The Experts</div>
          <div className="section-title">Our <span>Team</span></div>
        </div>
        
        {loading ? (
          // Loading skeletons
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="team-card"
                role="article"
                aria-label="Loading team member"
              >
                <div className="team-avatar">
                  <div className="avatar-ring" />
                  <div className="avatar-inner bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                </div>
                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mx-auto mb-2 animate-pulse" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mx-auto mb-4 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6 mx-auto animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No team members available.
            </p>
          </div>
        ) : (
          // Team members grid
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4">
            {members.map((member, index) => (
              <TeamCard key={member.id} member={member} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
