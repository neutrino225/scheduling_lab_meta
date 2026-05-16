"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const payload = await response.json() as { message?: string };
        setError(payload.message || "Unable to login");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-canvas)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)"
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ width: "100%", maxWidth: "360px" }}>
            <div className="skeleton skeleton-text" style={{ width: "140px", height: "32px", marginBottom: "2.5rem" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="skeleton" style={{ height: "44px", borderRadius: "var(--radius-buttons)" }} />
              <div className="skeleton" style={{ height: "44px", borderRadius: "var(--radius-buttons)" }} />
              <div className="skeleton" style={{ height: "44px", borderRadius: "var(--radius-buttons)", marginTop: "0.75rem" }} />
            </div>
          </div>
        </div>
        <div style={{
          flex: 1,
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem",
        }} className="branding-side">
          <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "50%", marginBottom: "2rem" }} />
          <div className="skeleton skeleton-text" style={{ width: "220px", height: "20px", marginBottom: "0.75rem" }} />
          <div className="skeleton skeleton-text" style={{ width: "300px", height: "14px" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "var(--bg-canvas)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-body)"
    }}>
      {/* Theme Toggle Floating */}
      <div style={{ position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 50 }}>
        <ThemeToggle />
      </div>

      <div style={{
        display: "flex",
        width: "100%",
        flexDirection: "row"
      }} className="login-container">
        
        {/* Left Side: Form */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "var(--bg-canvas)"
        }}>
          <div style={{ width: "100%", maxWidth: "360px" }}>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-heading)",
              fontWeight: 600,
              letterSpacing: "var(--tracking-heading)",
              marginBottom: "2.5rem",
              color: "var(--text-primary)"
            }}>
              Sign In
            </h1>

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  autoComplete="username"
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 1rem",
                    borderRadius: "var(--radius-buttons)",
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "var(--text-body-sm)",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 1rem",
                    borderRadius: "var(--radius-buttons)",
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "var(--text-body-sm)",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {error && (
                <div style={{
                  color: "var(--status-danger)",
                  fontSize: "var(--text-body-sm)",
                  fontWeight: 500
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: "44px",
                  borderRadius: "var(--radius-buttons)",
                  border: "none",
                  background: loading ? "var(--text-muted)" : "var(--accent-primary)",
                  color: "var(--accent-text)",
                  fontSize: "var(--text-body-sm)",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  marginTop: "0.75rem"
                }}
              >
                {loading ? "Verifying..." : "Continue"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Branding */}
        <div style={{
          flex: 1,
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem",
          position: "relative",
          overflow: "hidden"
        }} className="branding-side">
          {/* Background Image with Overlay */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url('https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=2070&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15,
            filter: "grayscale(100%) brightness(0.5)"
          }} />
          
          <div style={{ maxWidth: "400px", position: "relative", zIndex: 1 }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              background: "var(--accent-primary)",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--bg-canvas)",
              boxShadow: "var(--shadow-sm)"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /><polyline points="16 16 12 12 8 16" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-subheading)",
              fontWeight: 600,
              letterSpacing: "var(--tracking-subheading)",
              marginBottom: "0.75rem",
              color: "var(--text-primary)"
            }}>
              The Publishing Desk.
            </h2>
            <p style={{
              fontSize: "var(--text-body)",
              lineHeight: "var(--leading-body)",
              letterSpacing: "var(--tracking-body)",
              color: "var(--text-muted)",
              margin: 0
            }}>
              Control your Meta presence from one place. Simple, file-based, and operator-focused.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .login-container {
            flex-direction: column !important;
          }
          .branding-side {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
