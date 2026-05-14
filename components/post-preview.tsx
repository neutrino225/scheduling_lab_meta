"use client";

import { useMemo, useState, useCallback } from "react";

interface PostPreviewProps {
  platform: "facebook" | "instagram";
  caption: string;
  media: { url: string; type: "image" | "video" }[];
  accountName?: string;
  profilePictureUrl?: string | null;
  view?: "mobile" | "desktop";
}

const iconHeart = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
const iconMsg = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const iconSend = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9Z" /></svg>;
const iconBookmark = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>;
const iconThumb = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>;
const iconGlobe = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const iconDots = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>;
const iconChevron = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;

function Avatar({ name, url }: { name: string; url?: string | null }) {
  return url ? (
    <img src={url} alt={name} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-primary)", flexShrink: 0, letterSpacing: "var(--tracking-body-sm)" }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CarouselMedia({ items, crop }: { items: { url: string; type: string }[]; crop?: boolean }) {
  const [idx, setIdx] = useState(0);
  const total = items.length;

  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : total - 1)), [total]);
  const next = useCallback(() => setIdx((i) => (i < total - 1 ? i + 1 : 0)), [total]);

  if (items.length === 0) return null;

  const current = items[idx];
  const content = current.type === "image" ? (
    <img src={current.url} alt="" style={{
      width: "100%", display: "block",
      height: crop ? "100%" : "auto",
      objectFit: crop ? "cover" : "contain",
      maxHeight: crop ? undefined : "600px",
    }} />
  ) : (
    <video src={current.url} style={{
      width: "100%", display: "block",
      height: crop ? "100%" : "auto",
      objectFit: crop ? "cover" : "contain",
      maxHeight: crop ? undefined : "600px",
    }} muted autoPlay loop />
  );

  return (
    <div style={{ position: "relative", width: "100%", ...(crop ? { aspectRatio: "4 / 5", overflow: "hidden" } : {}) }}>
      {content}
      {total > 1 && (
        <>
          <button onClick={prev} style={{
            position: "absolute", left: "6px", top: "50%", transform: "translateY(-50%)",
            width: "28px", height: "28px", borderRadius: "50%", border: "none",
            background: "var(--color-graphite-black)", color: "var(--color-canvas-white)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.15s",
          }} className="carousel-arrow">{iconChevron}</button>
          <button onClick={next} style={{
            position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%) rotate(180deg)",
            width: "28px", height: "28px", borderRadius: "50%", border: "none",
            background: "var(--color-graphite-black)", color: "var(--color-canvas-white)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.15s",
          }} className="carousel-arrow">{iconChevron}</button>
          <div style={{
            position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: "5px", alignItems: "center",
          }}>
            {items.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{
                width: i === idx ? "18px" : "6px", height: "6px", borderRadius: "3px",
                border: "none", background: i === idx ? "var(--accent-primary)" : "var(--color-cloud-mist)",
                cursor: "pointer", transition: "all 0.2s", padding: 0,
              }} />
            ))}
          </div>
          <div style={{ position: "absolute", top: "10px", right: "10px", padding: "2px 8px", borderRadius: "20px", background: "var(--color-graphite-black)", color: "var(--color-canvas-white)", fontSize: "0.7rem", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
            {idx + 1}/{total}
          </div>
          <style>{`
            .carousel-arrow { opacity: 0 !important; }
            div:hover > .carousel-arrow { opacity: 1 !important; }
          `}</style>
        </>
      )}
    </div>
  );
}

export function PostPreview({ platform, caption, media, accountName = "Your Page", profilePictureUrl, view = "mobile" }: PostPreviewProps) {
  const isInstagram = platform === "instagram";
  const cardMaxWidth = view === "desktop" ? "680px" : "420px";

  const preview = useMemo(() => {
    if (isInstagram) {
      return (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-cards)", overflow: "hidden", maxWidth: cardMaxWidth }}>
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Avatar name={accountName} url={profilePictureUrl} />
            <div style={{ fontWeight: 600, fontSize: "var(--text-body-sm)", color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "var(--tracking-body-sm)" }}>{accountName}</div>
            <div style={{ color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>{iconDots}</div>
          </div>
          <div style={{ background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", borderTop: "1px solid var(--border-default)", borderBottom: "1px solid var(--border-default)", minHeight: media.length > 0 ? "auto" : "400px", position: "relative" }}>
            {media.length > 0 ? <CarouselMedia items={media} crop /> : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: "var(--text-subtle)", padding: "4rem 0" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                </div>
                <span style={{ fontSize: "var(--text-body-sm)", fontWeight: 500, letterSpacing: "var(--tracking-body-sm)" }}>Media required for Instagram</span>
              </div>
            )}
          </div>
          <div style={{ padding: "10px 16px 6px", display: "flex", gap: "14px", color: "var(--text-primary)", alignItems: "center" }}>
            <span style={{ cursor: "pointer", display: "flex" }}>{iconHeart}</span>
            <span style={{ cursor: "pointer", display: "flex" }}>{iconMsg}</span>
            <span style={{ cursor: "pointer", display: "flex" }}>{iconSend}</span>
            <span style={{ marginLeft: "auto", cursor: "pointer", display: "flex" }}>{iconBookmark}</span>
          </div>
          <div style={{ padding: "0 16px 10px" }}>
            {caption ? (
              <div style={{ fontSize: "var(--text-body-sm)", lineHeight: "var(--leading-body-sm)", letterSpacing: "var(--tracking-body-sm)", color: "var(--text-primary)" }}>
                <span style={{ fontWeight: 600, marginRight: "6px" }}>{accountName}</span>
                <span style={{ whiteSpace: "pre-wrap" }}>{caption}</span>
              </div>
            ) : <span style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", fontStyle: "italic" }}>Enter a caption to preview...</span>}
          </div>
          <div style={{ padding: "0 16px 12px", fontSize: "var(--text-caption)", color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Just now</div>
        </div>
      );
    }

    return (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-cards)", overflow: "hidden", maxWidth: cardMaxWidth }}>
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Avatar name={accountName} url={profilePictureUrl} />
            <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "var(--text-body-sm)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "var(--tracking-body-sm)" }}>{accountName}</div>
            <div style={{ fontSize: "var(--text-caption)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              Just now <span style={{ fontSize: "0.6rem" }}>•</span> <span style={{ display: "flex", color: "var(--text-subtle)" }} title="Public">{iconGlobe}</span>
            </div>
            </div>
            <div style={{ color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>{iconDots}</div>
          </div>

        {caption && <div style={{ padding: "0 16px 12px", fontSize: "var(--text-body-sm)", lineHeight: "var(--leading-body-sm)", letterSpacing: "var(--tracking-body-sm)", whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>{caption}</div>}

        <div style={{ background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", borderTop: caption && media.length > 0 ? "1px solid var(--border-default)" : "none", borderBottom: "1px solid var(--border-default)", minHeight: media.length > 0 ? "auto" : "280px", position: "relative" }}>
          {media.length > 0 ? <CarouselMedia items={media} /> : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: "var(--text-subtle)", padding: "4rem 0" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              </div>
              <span style={{ fontSize: "var(--text-body-sm)", fontWeight: 500, letterSpacing: "var(--tracking-body-sm)" }}>No media attached</span>
            </div>
          )}
          {media.length > 1 && (
            <div style={{ position: "absolute", top: "10px", right: "10px", padding: "2px 8px", borderRadius: "20px", background: "var(--color-graphite-black)", color: "var(--color-canvas-white)", fontSize: "0.7rem", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              1/{media.length}
            </div>
          )}
        </div>

        <div style={{ padding: "8px 16px", display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "var(--text-body-sm)" }}>
          <span>0 Likes</span>
          <span>0 Comments · 0 Shares</span>
        </div>

        <div style={{ borderTop: "1px solid var(--border-default)", display: "flex", padding: "2px 0" }}>
          {[{ icon: iconThumb, label: "Like" }, { icon: iconMsg, label: "Comment" }, { icon: iconSend, label: "Share" }].map((a) => (
            <div key={a.label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", borderRadius: "var(--radius-buttons)", cursor: "pointer", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-muted)", transition: "background 0.1s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >{a.icon}{a.label}</div>
          ))}
        </div>
      </div>
    );
  }, [isInstagram, platform, accountName, profilePictureUrl, caption, media, cardMaxWidth]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "sticky", top: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-default)" }}>
        <h2 style={{ fontSize: "var(--text-caption)", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "var(--font-heading)" }}>
          {platform === "instagram" ? "Instagram Feed" : "Facebook Feed"}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isInstagram ? "var(--accent-primary)" : "var(--text-primary)" }} />
          <span style={{ color: "var(--text-primary)", fontSize: "var(--text-caption)", fontWeight: 600, textTransform: "uppercase", fontFamily: "var(--font-heading)" }}>{platform}</span>
        </div>
      </div>

      {preview}

      {caption && (
        <div style={{ padding: "0.75rem 1rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-cards)", border: "1px solid var(--border-default)" }}>
          <div style={{ fontSize: "var(--text-caption)", fontWeight: 600, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Caption preview</div>
          <div style={{ fontSize: "var(--text-body-sm)", color: "var(--text-muted)", lineHeight: "var(--leading-body-sm)", letterSpacing: "var(--tracking-body-sm)", whiteSpace: "pre-wrap", maxHeight: "4.5em", overflow: "hidden" }}>{caption}</div>
          <div style={{ fontSize: "var(--text-caption)", color: "var(--text-subtle)", marginTop: "0.25rem", fontFamily: "var(--font-mono)" }}>{caption.length} chars</div>
        </div>
      )}
    </div>
  );
}
