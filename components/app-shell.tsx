"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { postJson } from "@/lib/client/api";

const navItems = [
  { 
    href: "/", 
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    )
  },
  { 
    href: "/posts", 
    label: "Posts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    )
  },
  { 
    href: "/posts/new", 
    label: "Create",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  { 
    href: "/jobs", 
    label: "Jobs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    )
  },
  { 
    href: "/accounts", 
    label: "Accounts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    )
  },
];

function NavLinks({ onClick, mobile, collapsed }: { onClick?: () => void; mobile?: boolean; collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {navItems.map((item) => {
        const active = pathname === item.href;
        return mobile ? (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "2px", flex: 1,
              padding: "6px 0", textDecoration: "none",
              color: active ? "var(--accent-primary)" : "var(--text-muted)",
              fontSize: "0.625rem", fontWeight: active ? 600 : 450,
              borderTop: "2px solid",
              borderTopColor: active ? "var(--accent-primary)" : "transparent",
            }}
          >
            {item.icon}
            {item.label}
          </Link>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            title={collapsed ? item.label : undefined}
            style={{
              display: "flex", 
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? "0" : "10px",
              width: "100%",
              padding: "10px 12px", 
              borderRadius: "8px",
              fontSize: "0.875rem", 
              fontWeight: active ? 600 : 500,
              textDecoration: "none",
              background: active ? "var(--accent-surface)" : "transparent",
              color: active ? "var(--accent-text)" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = "var(--bg-subtle)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }
            }}
          >
            <span style={{ display: "flex", color: active ? "var(--accent-primary)" : "inherit" }}>
              {item.icon}
            </span>
            {!collapsed && item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await postJson("/api/auth/logout", {});
      router.push("/api/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
      setLoggingOut(false);
    }
  };

  const LogoutButton = ({ mobile, collapsed }: { mobile?: boolean; collapsed?: boolean }) => (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: (mobile || collapsed) ? "center" : "flex-start",
        gap: (mobile || collapsed) ? "0" : "10px",
        width: "100%",
        height: (mobile || collapsed) ? "40px" : "auto",
        padding: (mobile || collapsed) ? "0" : "10px 12px",
        borderRadius: "8px",
        border: mobile ? "1px solid var(--border-default)" : "none",
        background: "transparent",
        color: "var(--status-danger)",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: 600,
        marginTop: mobile ? "0" : "12px",
        transition: "all 0.15s ease",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--status-danger-surface)";
        if (!mobile) e.currentTarget.style.color = "var(--status-danger)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
      title="Logout"
    >
      <span style={{ display: "flex", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </span>
      {!(mobile || collapsed) && <span>Logout</span>}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-canvas)", color: "var(--text-primary)" }}>
      {/* Desktop header */}
      <header style={{
        height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.5rem", borderBottom: "1px solid var(--border-default)",
        background: "var(--bg-surface)",
      }} className="desktop-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            style={{ 
              background: "none", border: "none", color: "var(--text-muted)", 
              cursor: "pointer", padding: "8px", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-subtle)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
            Meta Lab
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Mobile top bar */}
      <div style={{
        display: "none", height: "64px", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.25rem", borderBottom: "1px solid var(--border-default)",
        background: "var(--bg-surface)",
      }} className="mobile-topbar">
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Meta Lab
        </span>
        <div style={{ display: "flex", gap: "10px" }}>
          <ThemeToggle />
          <LogoutButton mobile />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Desktop sidebar */}
        <aside style={{
          width: collapsed ? "72px" : "240px", 
          minWidth: collapsed ? "72px" : "240px",
          borderRight: "1px solid var(--border-default)",
          background: "var(--bg-surface)", display: "flex", flexDirection: "column",
          transition: "width 0.2s ease, min-width 0.2s ease",
        }} className="desktop-sidebar">
          <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "1.25rem 0.75rem", gap: "1.5rem" }}>
            <div>
              {!collapsed && (
                <div style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 600, 
                  color: "var(--text-subtle)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.08em",
                  padding: "0 12px 10px",
                  fontFamily: "var(--font-heading)"
                }}>
                  Platform
                </div>
              )}
              <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <NavLinks collapsed={collapsed} />
              </nav>
            </div>

            <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-default)", paddingTop: "1rem" }}>
              <LogoutButton collapsed={collapsed} />
            </div>
          </div>
        </aside>

        <main style={{ padding: "2rem 2.5rem", flex: 1, overflowY: "auto", minWidth: 0, paddingBottom: "72px" }} className="main-content">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="mobile-bottom-nav"
        style={{
          display: "none", alignItems: "stretch", height: "64px",
          borderTop: "1px solid var(--border-default)",
          background: "var(--bg-surface)",
        }}
      >
        <NavLinks mobile />
      </nav>

      <style>{`
        .desktop-header { display: flex; }
        .desktop-sidebar { display: flex; }
        @media (max-width: 768px) {
          .desktop-header { display: none !important; }
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .main-content { padding-bottom: 80px !important; }
        }
      `}</style>
    </div>
  );
}
