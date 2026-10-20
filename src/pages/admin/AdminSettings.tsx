import { useEffect, useState } from "react";
import { Loader2, Save, Plus, Trash2, Globe, Phone, Mail, MapPin, Link2, Copyright } from "lucide-react";
import { toast } from "sonner";
import { listNativeSiteSettings, saveNativeSiteSettings } from "@/lib/nativeAdminOperations";

interface FooterLink {
  label: string;
  to: string;
}

interface SiteSettings {
  phone_number: string;
  whatsapp_number: string;
  email: string;
  address: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  youtube: string;
  quick_links: FooterLink[];
  service_links: string[];
  copyright_text: string;
  privacy_policy_url: string;
  terms_url: string;
}

const defaultSettings: SiteSettings = {
  phone_number: "",
  whatsapp_number: "",
  email: "",
  address: "",
  instagram: "",
  linkedin: "",
  facebook: "",
  twitter: "",
  youtube: "",
  quick_links: [
    { label: "Home", to: "/" },
    { label: "About Us", to: "/about" },
    { label: "Services", to: "/services" },
    { label: "Projects", to: "/projects" },
    { label: "Contact", to: "/contact" },
  ],
  service_links: [
    "Electrical Servicing",
    "Device Installation",
    "Equipment Repair",
    "Wiring & Maintenance",
    "Home Troubleshooting",
  ],
  copyright_text: "Electroobuddy. All rights reserved.",
  privacy_policy_url: "/privacy",
  terms_url: "/terms",
};

type Tab = "contact" | "social" | "footer" | "legal";

const AdminSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("contact");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await listNativeSiteSettings();
        if (data) {
          const loaded = { ...defaultSettings };
          data.forEach((s: any) => {
            if (s.key in loaded) {
              try {
                (loaded as any)[s.key] = JSON.parse(s.value);
              } catch {
                (loaded as any)[s.key] = s.value;
              }
            }
          });
          setSettings(loaded);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(settings).map(([key,value])=>[key,typeof value === "object" ? JSON.stringify(value) : String(value)]));
      await saveNativeSiteSettings(payload);
      toast.success("Settings saved successfully");
    } catch (error) { toast.error("Failed to save settings"); }
    setSaving(false);
  };

  const updateField = (key: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addQuickLink = () => {
    updateField("quick_links", [...settings.quick_links, { label: "", to: "" }]);
  };

  const removeQuickLink = (index: number) => {
    updateField("quick_links", settings.quick_links.filter((_, i) => i !== index));
  };

  const updateQuickLink = (index: number, field: keyof FooterLink, value: string) => {
    const updated = [...settings.quick_links];
    updated[index] = { ...updated[index], [field]: value };
    updateField("quick_links", updated);
  };

  const addServiceLink = () => {
    updateField("service_links", [...settings.service_links, ""]);
  };

  const removeServiceLink = (index: number) => {
    updateField("service_links", settings.service_links.filter((_, i) => i !== index));
  };

  const updateServiceLink = (index: number, value: string) => {
    const updated = [...settings.service_links];
    updated[index] = value;
    updateField("service_links", updated);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "contact", label: "Contact", icon: <Phone size={16} /> },
    { id: "social", label: "Social Media", icon: <Globe size={16} /> },
    { id: "footer", label: "Footer Links", icon: <Link2 size={16} /> },
    { id: "legal", label: "Copyright & Legal", icon: <Copyright size={16} /> },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Site Settings</h1>

      <div className="bg-card border border-border rounded-xl overflow-hidden max-w-3xl">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {activeTab === "contact" && (
            <>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  value={settings.phone_number}
                  onChange={(e) => updateField("phone_number", e.target.value)}
                  className={inputClass}
                  placeholder="+917000396039"
                />
              </div>
              <div>
                <label className={labelClass}>WhatsApp Number (without +)</label>
                <input
                  value={settings.whatsapp_number}
                  onChange={(e) => updateField("whatsapp_number", e.target.value)}
                  className={inputClass}
                  placeholder="917000396039"
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  value={settings.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={inputClass}
                  placeholder="electroobuddy@gmail.com"
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className={inputClass}
                  rows={2}
                  placeholder="05, Nagziri Dewas Road, Ujjain (456010), India"
                />
              </div>
            </>
          )}

          {activeTab === "social" && (
            <>
              <div>
                <label className={labelClass}>Instagram URL</label>
                <input
                  value={settings.instagram}
                  onChange={(e) => updateField("instagram", e.target.value)}
                  className={inputClass}
                  placeholder="https://www.instagram.com/electroobuddy"
                />
              </div>
              <div>
                <label className={labelClass}>LinkedIn URL</label>
                <input
                  value={settings.linkedin}
                  onChange={(e) => updateField("linkedin", e.target.value)}
                  className={inputClass}
                  placeholder="https://www.linkedin.com/company/electroobuddy"
                />
              </div>
              <div>
                <label className={labelClass}>Facebook URL</label>
                <input
                  value={settings.facebook}
                  onChange={(e) => updateField("facebook", e.target.value)}
                  className={inputClass}
                  placeholder="https://www.facebook.com/electroobuddy"
                />
              </div>
              <div>
                <label className={labelClass}>Twitter / X URL</label>
                <input
                  value={settings.twitter}
                  onChange={(e) => updateField("twitter", e.target.value)}
                  className={inputClass}
                  placeholder="https://twitter.com/electroobuddy"
                />
              </div>
              <div>
                <label className={labelClass}>YouTube URL</label>
                <input
                  value={settings.youtube}
                  onChange={(e) => updateField("youtube", e.target.value)}
                  className={inputClass}
                  placeholder="https://www.youtube.com/@electroobuddy"
                />
              </div>
            </>
          )}

          {activeTab === "footer" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass + " !mb-0"}>Quick Links</label>
                  <button onClick={addQuickLink} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus size={14} /> Add Link
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.quick_links.map((link, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        value={link.label}
                        onChange={(e) => updateQuickLink(i, "label", e.target.value)}
                        className={inputClass + " flex-1"}
                        placeholder="Label"
                      />
                      <input
                        value={link.to}
                        onChange={(e) => updateQuickLink(i, "to", e.target.value)}
                        className={inputClass + " flex-1"}
                        placeholder="/path"
                      />
                      <button onClick={() => removeQuickLink(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass + " !mb-0"}>Service Links</label>
                  <button onClick={addServiceLink} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus size={14} /> Add Service
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.service_links.map((service, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        value={service}
                        onChange={(e) => updateServiceLink(i, e.target.value)}
                        className={inputClass + " flex-1"}
                        placeholder="Service name"
                      />
                      <button onClick={() => removeServiceLink(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "legal" && (
            <>
              <div>
                <label className={labelClass}>Copyright Text</label>
                <input
                  value={settings.copyright_text}
                  onChange={(e) => updateField("copyright_text", e.target.value)}
                  className={inputClass}
                  placeholder="Electroobuddy. All rights reserved."
                />
              </div>
              <div>
                <label className={labelClass}>Privacy Policy URL</label>
                <input
                  value={settings.privacy_policy_url}
                  onChange={(e) => updateField("privacy_policy_url", e.target.value)}
                  className={inputClass}
                  placeholder="/privacy"
                />
              </div>
              <div>
                <label className={labelClass}>Terms & Conditions URL</label>
                <input
                  value={settings.terms_url}
                  onChange={(e) => updateField("terms_url", e.target.value)}
                  className={inputClass}
                  placeholder="/terms"
                />
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
