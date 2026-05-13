"use client";

import { useCallback, useRef, useState } from "react";

interface FileUploadProps {
  platform: "facebook" | "instagram";
  onUpload: (result: { key: string; publicUrl: string; type: "image" | "video"; name: string }) => void;
  disabled?: boolean;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const ALLOWED_GIF = ["image/gif"];
const MAX_SIZE = 100 * 1024 * 1024;

function getFileType(mime: string): "image" | "video" | null {
  if (ALLOWED_IMAGE_TYPES.includes(mime) || ALLOWED_GIF.includes(mime)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(mime)) return "video";
  return null;
}

export function FileUpload({ platform, onUpload, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const allowedTypes = platform === "facebook"
    ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_GIF, ...ALLOWED_VIDEO_TYPES]
    : [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

  const validate = useCallback((f: File): string | null => {
    if (!allowedTypes.includes(f.type)) {
      return platform === "instagram"
        ? "Instagram supports: JPG, PNG, WebP, MP4"
        : "Facebook supports: JPG, PNG, GIF, WebP, MP4, MOV";
    }
    if (f.size > MAX_SIZE) return "File exceeds 100MB limit";
    return null;
  }, [allowedTypes, platform]);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", getFileType(file.type) || "image");

      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      onUpload({ 
        key: data.key, 
        publicUrl: data.publicUrl, 
        type: getFileType(file.type) as "image" | "video", 
        name: file.name 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  function handleFile(f: File) {
    setError(null);
    const err = validate(f);
    if (err) { setError(err); return; }
    upload(f);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <label style={{ 
        display: "block", 
        fontSize: "0.875rem", 
        fontWeight: 600, 
        marginBottom: "0.5rem", 
        color: "var(--text-primary)" 
      }}>
        Media {platform === "instagram" ? "(required)" : "(optional)"}
      </label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setDragOver(false); 
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); 
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          flex: 1,
          minHeight: "120px",
          border: `1px dashed ${dragOver ? "var(--accent-primary)" : "var(--border-default)"}`,
          borderRadius: "10px", 
          padding: "1.5rem", 
          textAlign: "center", 
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: dragOver ? "var(--bg-subtle)" : "transparent",
          opacity: (disabled || uploading) ? 0.5 : 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={allowedTypes.join(",")}
          hidden
          disabled={disabled || uploading}
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />

        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div className="spinner"></div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Uploading...</div>
          </div>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ marginBottom: "0.75rem" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--status-danger)", fontWeight: 600 }}>Click to upload</strong> or drag and drop
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "0.25rem" }}>
              {platform === "facebook"
                ? "JPG, PNG, GIF, WebP, MP4, MOV (100MB max)"
                : "JPG, PNG, WebP, MP4 (100MB max)"}
            </div>
          </>
        )}
      </div>

      {error && <p style={{ color: "var(--status-danger)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}
