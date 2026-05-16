"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getApiData } from "@/lib/client/api";
import { PostCard } from "@/components/post-card";
import type { PostWithDetails } from "@/lib/client/types";
import { Select } from "@/components/primitives";
import "@/app/components.css";

const dateRanges = [
  { label: "All time", value: "" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

export function PostsContent({ initialPosts }: { initialPosts: PostWithDetails[] }) {
  const [rows, setRows] = useState<PostWithDetails[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState("createdAt_desc");
  const [dateRange, setDateRange] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const getCreatedAfter = useCallback((range: string) => {
    if (!range) return undefined;
    const days = parseInt(range.replace("d", ""), 10);
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }, []);

  useEffect(() => {
    // Skip initial load since we have initialPosts
    if (rows === initialPosts && !search && !status && !platform && sort === "createdAt_desc" && !dateRange) {
        return;
    }

    let active = true;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ limit: "100", details: "true", sort });
      if (status) params.set("status", status);
      if (platform) params.set("platform", platform);
      if (search) params.set("search", search);
      const createdAfter = getCreatedAfter(dateRange);
      if (createdAfter) params.set("createdAfter", String(createdAfter));
      try {
        const data = await getApiData<PostWithDetails[]>(`/api/posts/list?${params}`);
        if (active) setRows(data);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [search, status, platform, sort, dateRange, getCreatedAfter, initialPosts]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Posts</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: "0.25rem 0 1rem" }}>
        Browse, filter, and manage all your scheduled and published content.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="filter-search" style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search captions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="input"
            style={{ paddingRight: "2.25rem" }}
          />
          <button
            onClick={handleSearch}
            style={{
              position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
              padding: "4px", display: "flex", borderRadius: "4px",
            }}
            title="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
        <div style={{ flex: "1 1 140px", minWidth: "120px" }}>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="processing">Processing</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
        <div style={{ flex: "1 1 120px", minWidth: "100px" }}>
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">All platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </Select>
        </div>
        <div style={{ flex: "1 1 150px", minWidth: "130px" }}>
          <Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="createdAt_desc">Newest first</option>
            <option value="createdAt_asc">Oldest first</option>
            <option value="scheduledAt_asc">Scheduled soonest</option>
            <option value="scheduledAt_desc">Scheduled latest</option>
            <option value="publishedAt_desc">Recently published</option>
            <option value="status_asc">Status A-Z</option>
            <option value="status_desc">Status Z-A</option>
          </Select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {dateRanges.map((dr) => {
          const active = dateRange === dr.value;
          return (
            <button
              key={dr.value}
              onClick={() => setDateRange(dr.value)}
              style={{
                padding: "4px 12px", borderRadius: "var(--radius-buttons)", border: "1px solid",
                borderColor: active ? "var(--accent-primary)" : "var(--border-default)",
                background: active ? "var(--accent-surface)" : "transparent",
                color: active ? "var(--accent-primary)" : "var(--text-muted)",
                cursor: "pointer", fontSize: "0.8rem", fontWeight: active ? 600 : 500,
                fontFamily: "inherit", transition: "all 0.12s",
              }}
            >
              {dr.label}
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header" style={{ justifyContent: "space-between" }}>
          <span>Posts</span>
          {!loading && (
            <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-subtle)" }}>
              {rows.length} result{rows.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {loading ? (
          <div style={{ padding: "1.25rem" }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton skeleton-row" style={{ height: "80px", marginBottom: "0.75rem", borderRadius: "var(--radius-cards)" }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: 0 }}>
            No posts found.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((row) => (
              <PostCard 
                key={row.id} 
                post={row} 
                onDelete={(id) => {
                  setRows((prev) => prev.filter((r) => r.id !== id));
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
