import { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useServicesStore } from "@/stores/servicesStore";
import ServiceCard2 from "@/components/ServiceCard2";
import PublicApiState from "@/components/PublicApiState";

const UserServices = () => {
  const { services, loading, error, fetchServices, refreshServices } = useServicesStore();

  // Fetch services on mount
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleBookService = (serviceTitle: string) => {
    window.location.href = `/booking?service=${encodeURIComponent(serviceTitle)}`;
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold mb-2">Our Services</h1>
        <p className="text-muted-foreground">Professional electrical services tailored to your needs</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <PublicApiState error={error} onRetry={refreshServices} errorMessage="We could not load services from the API." />
      ) : services.length === 0 ? (
        <PublicApiState empty emptyMessage="No services are currently published." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
            >
              <ServiceCard2 service={service} onBookNow={handleBookService} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserServices;
