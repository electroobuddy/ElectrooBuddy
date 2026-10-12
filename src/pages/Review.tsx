import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitNativeTestimonial } from "@/lib/nativeAdminOperations";

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";

const StarRating = ({ value, onChange }: { value: number; onChange?: (r: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((r) => (
      <button key={r} type="button" onClick={() => onChange?.(r)}
        className={`transition-transform ${onChange ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}>
        <Star size={20}
          className={r <= value ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-700"} />
      </button>
    ))}
  </div>
);

const Review = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", service: "", rating: 5, text: "" });
  const [saving, setSaving] = useState(false);

  const patch = (patchData: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patchData }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      toast.error("Name and review text are required");
      return;
    }

    setSaving(true);
    try { await submitNativeTestimonial({ name:form.name.trim(), service:form.service.trim()||null, rating:form.rating, text:form.text.trim() }); }
    catch (error:any) { toast.error(error?.message || "Failed to submit review"); setSaving(false); return; }

    toast.success("Thank you! Your review has been submitted.");
    setSaving(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10">
      <div className="max-w-xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Share Your Experience</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Let others know how we did. Your honest feedback helps us serve you better.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Your Name</label>
            <input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="John Doe" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Service You Used</label>
            <input value={form.service} onChange={(e) => patch({ service: e.target.value })} placeholder="Wiring & Maintenance" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Rating</label>
            <div className="flex items-center gap-3">
              <StarRating value={form.rating} onChange={(r) => patch({ rating: r })} />
              <span className="text-sm font-semibold text-amber-500">{form.rating}/5</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Review</label>
            <textarea value={form.text} onChange={(e) => patch({ text: e.target.value })} rows={5} placeholder="Tell us about your experience..." className={`${inputCls} resize-none`} />
            <p className="text-xs text-zinc-400">{form.text.length} characters</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-60 flex items-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Review;
