import { validateImageUpload } from "@/lib/security";
import { useState, useRef } from "react";
import { uploadAdminImage } from "@/lib/storageApi";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  folder: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
}

const ImageUpload = ({ folder, currentUrl, onUpload, onRemove }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setUploading(true);
    const validationError = validateImageUpload(file);
    if (validationError) { toast.error(validationError); return; }
    try {
      const uploaded = await uploadAdminImage(file, folder);
      onUpload(uploaded.url);
      toast.success("Image uploaded");
    } catch (error: any) {
      toast.error("Upload failed: " + (error?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {currentUrl ? (
        <div className="relative inline-block">
          <img src={currentUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-border" />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : null}
      <div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background text-foreground hover:bg-muted disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading..." : currentUrl ? "Change Image" : "Upload Image"}
        </button>
      </div>
    </div>
  );
};

export default ImageUpload;
