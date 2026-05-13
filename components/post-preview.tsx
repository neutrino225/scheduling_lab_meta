"use client";

import { useMemo } from "react";

interface PostPreviewProps {
  platform: "facebook" | "instagram";
  caption: string;
  media: { url: string; type: "image" | "video" }[];
  accountName?: string;
  profilePictureUrl?: string;
}

export function PostPreview({ 
  platform, 
  caption, 
  media, 
  accountName = "Your Page",
  profilePictureUrl
}: PostPreviewProps) {
  const isInstagram = platform === "instagram";
  
  const mediaContent = useMemo(() => {
    if (media.length === 0) return null;
    const first = media[0];
    if (first.type === "image") {
      return (
        <img 
          src={first.url} 
          alt="Post preview" 
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} 
        />
      );
    } else {
      return (
        <video 
          src={first.url} 
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} 
          controls={false}
          autoPlay
          muted
          loop
        />
      );
    }
  }, [media]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "sticky", top: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-default)" }}>
        <h2 style={{ 
          fontSize: "0.75rem", 
          fontWeight: 600, 
          color: "var(--text-muted)", 
          textTransform: "uppercase", 
          letterSpacing: "0.1em",
          margin: 0,
          fontFamily: "var(--font-heading)"
        }}>
          Post Preview
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ 
            width: "6px", 
            height: "6px", 
            borderRadius: "50%", 
            background: isInstagram ? "var(--status-info)" : "var(--status-success)" 
          }} />
          <span style={{ 
            color: "var(--text-primary)", 
            fontSize: "0.75rem", 
            fontWeight: 600, 
            textTransform: "uppercase",
            fontFamily: "var(--font-heading)"
          }}>
            {platform}
          </span>
        </div>
      </div>

      <div className="card" style={{ 
        overflow: "hidden", 
        maxWidth: "520px", 
        width: "100%", 
        boxShadow: "var(--shadow-panel)",
        border: "1px solid var(--border-default)",
        background: "var(--bg-surface)"
      }}>
        {/* Post Header */}
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: isInstagram ? "none" : "1px solid var(--border-default)" }}>
          {profilePictureUrl ? (
            <img 
              src={profilePictureUrl} 
              alt={accountName}
              style={{ 
                width: "38px", height: "38px", borderRadius: "50%", 
                objectFit: "cover", flexShrink: 0,
                border: "1px solid var(--border-default)"
              }} 
            />
          ) : (
            <div style={{ 
              width: "38px", height: "38px", borderRadius: "50%", 
              background: "var(--bg-subtle)", display: "flex", alignItems: "center", 
              justifyContent: "center", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)",
              flexShrink: 0,
              border: "1px solid var(--border-default)",
              fontFamily: "var(--font-heading)"
            }}>
              {accountName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, lineHeight: "1.2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>
              {accountName}
            </div>
            {!isInstagram && (
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                Just now <span style={{ fontSize: "0.625rem" }}>•</span> <span title="Public">🌎</span>
              </div>
            )}
          </div>
          {!isInstagram && (
            <div style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>•••</div>
          )}
        </div>

        {/* Facebook Caption (above media) */}
        {!isInstagram && caption && (
          <div style={{ padding: "12px 16px 16px", fontSize: "0.9375rem", lineHeight: "1.5", whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
            {caption}
          </div>
        )}

        {/* Media Area */}
        <div style={{ 
          aspectRatio: isInstagram ? "1/1" : "16/9", 
          background: "var(--bg-muted)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          minHeight: isInstagram ? "400px" : "280px",
          borderTop: !isInstagram && !caption ? "1px solid var(--border-default)" : "none",
          borderBottom: "1px solid var(--border-default)",
          position: "relative"
        }}>
          {mediaContent || (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "var(--text-subtle)" }}>
              <div style={{ 
                width: "64px", height: "64px", borderRadius: "50%", 
                background: "var(--bg-subtle)", display: "flex", 
                alignItems: "center", justifyContent: "center" 
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>No media selected</span>
            </div>
          )}
        </div>

        {/* Post Actions & Content */}
        <div style={{ padding: "16px" }}>
          {isInstagram ? (
            <>
              <div style={{ display: "flex", gap: "16px", color: "var(--text-primary)", fontSize: "1.5rem", marginBottom: "12px" }}>
                 <span style={{ cursor: "pointer" }}>♡</span>
                 <span style={{ cursor: "pointer" }}>○</span>
                 <span style={{ cursor: "pointer" }}>▷</span>
                 <span style={{ marginLeft: "auto", cursor: "pointer" }}>口</span>
              </div>
              <div style={{ fontSize: "0.875rem", lineHeight: "1.5", color: "var(--text-primary)" }}>
                <span style={{ fontWeight: 700, marginRight: "8px" }}>{accountName}</span>
                {caption ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{caption}</span>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No caption provided...</span>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "12px", letterSpacing: "0.02em" }}>
                Just now
              </div>
            </>
          ) : (
            <>
               <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border-default)", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                 <span>0 Likes</span>
                 <span>0 Comments · 0 Shares</span>
               </div>
               <div style={{ display: "flex", gap: "8px", paddingTop: "8px", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>
                 <div style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "4px", cursor: "pointer" }}>👍 Like</div>
                 <div style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "4px", cursor: "pointer" }}>💬 Comment</div>
                 <div style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "4px", cursor: "pointer" }}>↗ Share</div>
               </div>
            </>
          )}
        </div>
      </div>
      
      <div style={{ 
        padding: "1.25rem", 
        background: "var(--muted-bg)", 
        border: "1px solid var(--border-default)", 
        borderRadius: "10px",
        fontSize: "0.8125rem",
        color: "var(--text-muted)",
        lineHeight: "1.5"
      }}>
        <div style={{ 
          fontWeight: 700, 
          color: "var(--text-primary)",
          marginBottom: "0.5rem", 
          display: "flex", 
          alignItems: "center", 
          gap: "0.625rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "0.75rem",
          fontFamily: "var(--font-heading)"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Technical Note
        </div>
        Previews are approximate and generated for visual composition. Final rendering depends on platform-specific responsive logic and API delivery.
      </div>
    </div>
  );
}
