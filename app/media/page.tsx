"use client";

import { AppShell } from "@/components/app-shell";
import "@/app/components.css";

export default function MediaPage() {
  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Media</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: "0.25rem 0 1rem" }}>
        Uploaded images and videos for your posts.
      </p>
      <div className="card">
        <p style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: 0 }}>
          No media uploaded yet.
        </p>
      </div>
    </AppShell>
  );
}
