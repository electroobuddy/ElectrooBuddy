import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
import { listNativeSubscribers, deleteNativeSubscriber } from "@/lib/nativeAdminOperations";
import { Loader2, Mail, RefreshCw, Trash2, Search, Download } from "lucide-react";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

const AdminSubscribers = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try { setSubscribers(await listNativeSubscribers()); }
    catch (error) { logger.error("Error fetching subscribers:", error); toast.error("Failed to load subscribers"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteSubscriber = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    try { await deleteNativeSubscriber(id); setSubscribers((prev) => prev.filter((s) => s.id !== id)); toast.success("Subscriber removed"); }
    catch { toast.error("Failed to remove subscriber"); }
  };

  const exportCSV = () => {
    const csv = "Email,Subscribed On\n" + filtered.map((s) => `${s.email},${new Date(s.created_at).toLocaleDateString()}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Mail size={22} className="text-blue-500" />
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {subscribers.length} total subscribers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Mail size={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            {subscribers.length === 0 ? "No subscribers yet" : "No results found"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left px-5 py-3 font-semibold text-zinc-600 dark:text-zinc-300">
                    #
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-zinc-600 dark:text-zinc-300">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-zinc-600 dark:text-zinc-300">
                    Subscribed On
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-zinc-600 dark:text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((subscriber, index) => (
                  <tr
                    key={subscriber.id}
                    className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-zinc-400 dark:text-zinc-500">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-900 dark:text-white font-medium">
                      {subscriber.email}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400">
                      {new Date(subscriber.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => deleteSubscriber(subscriber.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscribers;
