import { useEffect, useState } from "react";
import { listNativeAdminMessages, markNativeAdminMessageRead } from "@/lib/nativeAdminOperations";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Eye, Mail, X, Phone, AtSign,
  Wrench, MessageSquare, Clock, Check, RefreshCw, Search
} from "lucide-react";
import { toast } from "sonner";

// ─── Main component ───────────────────────────────────────────────────────────

const AdminMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const fetchData = async () => {
    try { setMessages(await listNativeAdminMessages()); }
    catch { toast.error("Failed to load messages"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const markRead = async (id: string) => {
    try { await markNativeAdminMessageRead(id); } catch { return; }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    if (selected?.id === id) setSelected((prev: any) => prev ? { ...prev, read: true } : null);
  };

  const openMessage = (m: any) => {
    setSelected(m);
    if (!m.read) markRead(m.id);
  };

  const filtered = messages.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.message || "").toLowerCase().includes(q);
    const matchFilter = filter === "all" || (filter === "read" ? m.read : !m.read);
    return matchSearch && matchFilter;
  });

  const unreadCount = messages.filter(m => !m.read).length;

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Mail size={22} className="text-blue-500" />
            Messages
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {messages.length} total · {unreadCount} unread
          </p>
        </div>
        <button onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all self-start">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or message…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
        </div>
        <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
          {(["all", "unread", "read"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}>
              {f}
              {f === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center rounded-full bg-white/20 text-xs">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Layout: list + detail side-by-side on large screens */}
      <div className="flex gap-5 min-h-0">
        {/* Message list */}
        <div className={`flex-1 min-w-0 space-y-2 ${selected ? "hidden lg:block lg:w-96 lg:flex-none" : ""}`}>
          {filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-zinc-400">
              <Mail size={44} strokeWidth={1.5} />
              <p className="font-medium text-zinc-600 dark:text-zinc-300">No messages found</p>
              <p className="text-sm">Try a different search or filter</p>
            </div>
          ) : filtered.map(m => (
            <motion.button key={m.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => openMessage(m)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:shadow-sm group ${
                selected?.id === m.id
                  ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                  : !m.read
                    ? "border-blue-100 dark:border-blue-900 bg-white dark:bg-zinc-900 hover:border-blue-200"
                    : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200"
              }`}>
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  !m.read ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}>
                  {m.name[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-bold truncate ${!m.read ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-200"}`}>
                      {m.name}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!m.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      <span className="text-xs text-zinc-400">
                        {new Date(m.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{m.email}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">{m.message}</p>
                  {m.service && (
                    <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                      {m.service}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <>
              {/* Mobile: full-screen overlay */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelected(null)} />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <MessageDetail message={selected} onClose={() => setSelected(null)} />
              </motion.div>

              {/* Desktop: side panel */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                className="hidden lg:flex lg:flex-col w-96 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <MessageDetail message={selected} onClose={() => setSelected(null)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Detail panel ─────────────────────────────────────────────────────────────

const MessageDetail = ({ message: m, onClose }: { message: any; onClose: () => void }) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">{m.name[0]?.toUpperCase()}</span>
        </div>
        <div>
          <p className="font-bold text-zinc-900 dark:text-white">{m.name}</p>
          <p className="text-xs text-zinc-400">{new Date(m.created_at).toLocaleString("en-IN")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {m.read
          ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              <Check size={10} /> Read
            </span>
          : <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> New
            </span>
        }
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <X size={15} />
        </button>
      </div>
    </div>

    {/* Body */}
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Contact info */}
      <div className="grid grid-cols-1 gap-3">
        {[
          { icon: <AtSign size={13} />, label: "Email", value: m.email },
          { icon: <Phone size={13} />,  label: "Phone", value: m.phone || "Not provided" },
          { icon: <Wrench size={13} />, label: "Service", value: m.service || "Not specified" },
        ].map(row => (
          <div key={row.label} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
            <span className="text-zinc-400 flex-shrink-0">{row.icon}</span>
            <div className="min-w-0">
              <p className="text-xs text-zinc-400">{row.label}</p>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message */}
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-700 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
          <MessageSquare size={13} className="text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Message</span>
        </div>
        <div className="p-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">{m.message}</p>
        </div>
      </div>

      {/* Reply button */}
      {m.email && (
        <a href={`mailto:${m.email}?subject=Re: Your enquiry`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
          <Mail size={14} /> Reply via Email
        </a>
      )}
    </div>
  </div>
);

export default AdminMessages;