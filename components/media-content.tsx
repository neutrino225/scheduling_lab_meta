"use client";

import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Select, Modal, Button } from "@/components/primitives";
import { deleteApiData } from "@/lib/client/api";
import "@/app/components.css";

interface MediaItem {
  id: string;
  url: string;
  type: string;
  postId: string;
  postCaption: string | null;
  postStatus: string;
  createdAt: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#706e6d",
  scheduled: "var(--accent-primary, #5a82de)",
  processing: "#d4a041",
  published: "#3a9d6d",
  failed: "var(--status-danger, #d04841)",
};

export function MediaContent({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [items, setItems] = useState<MediaItem[]>(initialMedia);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !search ||
        (item.postCaption && item.postCaption.toLowerCase().includes(search.toLowerCase()));
      const matchesType = !typeFilter || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, search, typeFilter]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(i => i.id));
    }
  }, [filtered, selectedIds]);

  async function handleBulkDelete() {
    setIsDeleting(true);
    const count = selectedIds.length;
    try {
      await deleteApiData("/api/media", { ids: selectedIds });
      setItems(prev => prev.filter(item => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setShowConfirm(false);
      toast.success(`Deleted ${count} media items`);
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete media");
    } finally {
      setIsDeleting(false);
    }
  }

  const hasSelection = selectedIds.length > 0;
  const allSelected = hasSelection && selectedIds.length === filtered.length;

  return (
    <AppShell>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Media</h1>
          <p style={styles.meta}>
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            {filtered.length !== items.length && (
              <> &middot; filtered from {items.length}</>
            )}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={selectAll}
            className="btn-subtle"
            style={styles.selectAllBtn}
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          {hasSelection && (
            <Button
              variant="primary"
              onClick={() => setShowConfirm(true)}
            >
              Delete {selectedIds.length}
            </Button>
          )}
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Filter by caption..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={styles.searchInput}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={styles.clearBtn}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div style={styles.filterSelect}>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>
            {items.length === 0 ? "No media uploaded." : "No media matches your filters."}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={"media-card"}
                style={styles.card(isSelected)}
                onClick={() => toggleSelect(item.id)}
              >
                <div className={"media-checkbox"} style={styles.checkbox(isSelected)}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                <div style={styles.thumb}>
                  {item.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" style={styles.thumbMedia} />
                  ) : (
                    <video src={item.url} style={styles.thumbMedia} />
                  )}
                </div>

                <div style={styles.info}>
                  <div style={styles.infoTop}>
                    <span style={styles.typeTag(item.type)}>
                      {item.type.toUpperCase()}
                    </span>
                    <span style={styles.date}>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div style={styles.infoBottom}>
                    <span style={styles.caption}>
                      {item.postCaption || "untitled"}
                    </span>
                    <div style={styles.infoActions} onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`/posts/${item.postId}`}
                        className="media-view-link"
                        style={styles.viewLink}
                      >
                        View
                      </a>
                      <span
                        style={styles.statusDot(item.postStatus)}
                        title={item.postStatus}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Delete Media"
        danger
        footer={
          <>
            <Button onClick={() => setShowConfirm(false)} variant="subtle">
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              variant="primary"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : `Delete ${selectedIds.length} items`}
            </Button>
          </>
        }
      >
        <p style={styles.modalText}>
          Remove {selectedIds.length} media items from storage and their
          associated posts. This cannot be undone.
        </p>
      </Modal>

      <style>{`
        .media-card:hover .media-checkbox {
          opacity: 1;
        }
        .media-card:hover {
          border-color: var(--text-subtle);
        }
        .media-view-link {
          opacity: 0;
          transition: opacity 0.12s ease;
        }
        .media-card:hover .media-view-link {
          opacity: 1;
        }
      `}</style>
    </AppShell>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: "16px",
  } as const,

  title: {
    fontFamily: "var(--font-heading)",
    fontSize: "var(--text-heading)",
    margin: 0,
    letterSpacing: "var(--tracking-heading)",
    lineHeight: 1,
  } as const,

  meta: {
    color: "var(--text-muted)",
    fontSize: "13px",
    fontFamily: "var(--font-mono, monospace)",
    margin: "6px 0 0",
    letterSpacing: "-0.01em",
  } as const,

  headerActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  } as const,

  selectAllBtn: {
    padding: "8px 12px",
    fontSize: "12px",
    letterSpacing: "0.03em",
    fontWeight: 600,
    textTransform: "uppercase" as const,
  } as const,

  toolbar: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "16px",
  } as const,

  searchWrapper: {
    flex: "1 1 240px",
    maxWidth: "320px",
    position: "relative" as const,
  } as const,

  searchInput: {
    paddingRight: "28px",
  } as const,

  clearBtn: {
    position: "absolute" as const,
    right: "6px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
  } as const,

  filterSelect: {
    flex: "0 0 150px",
  } as const,

  empty: {
    border: "1px solid var(--border-default)",
    borderRadius: "8px",
  } as const,

  emptyText: {
    padding: "24px",
    color: "var(--text-muted)",
    fontSize: "14px",
    margin: 0,
  } as const,

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "8px",
  } as const,

  card: (isSelected: boolean) =>
    ({
      position: "relative",
      overflow: "hidden",
      cursor: "pointer",
      borderRadius: "6px",
      border: isSelected
        ? "1px solid var(--accent-primary)"
        : "1px solid var(--border-default)",
      background: "var(--bg-surface)",
      transition: "border-color 0.15s ease",
    }) as const,

  checkbox: (isSelected: boolean) =>
    ({
      position: "absolute",
      top: "6px",
      left: "6px",
      zIndex: 10,
      width: "20px",
      height: "20px",
      borderRadius: "4px",
      border: "2px solid rgba(255,255,255,0.8)",
      background: isSelected
        ? "var(--accent-primary)"
        : "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: isSelected ? 1 : 0,
      transition: "opacity 0.12s ease",
    }) as const,

  thumb: {
    aspectRatio: "4 / 3",
    background: "var(--bg-subtle)",
    overflow: "hidden",
  } as const,

  thumbMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  } as const,

  info: {
    padding: "8px 10px 10px",
    borderTop: "1px solid var(--border-default)",
  } as const,

  infoTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  } as const,

  typeTag: (type: string) =>
    ({
      fontSize: "10px",
      fontWeight: 700,
      fontFamily: "var(--font-mono, monospace)",
      letterSpacing: "0.06em",
      color: type === "image" ? "#3a9d6d" : "#5a82de",
      textTransform: "uppercase",
    }) as const,

  date: {
    fontSize: "11px",
    fontFamily: "var(--font-mono, monospace)",
    color: "var(--text-subtle)",
    letterSpacing: "-0.01em",
  } as const,

  infoBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  } as const,

  caption: {
    fontSize: "12px",
    color: "var(--text-muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    flex: 1,
    minWidth: 0,
  } as const,

  statusDot: (status: string) =>
    ({
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: STATUS_COLORS[status] || "#706e6d",
      flexShrink: 0,
    }) as const,

  infoActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as const,

  viewLink: {
    fontSize: "10px",
    fontFamily: "var(--font-mono, monospace)",
    color: "var(--accent-primary)",
    textDecoration: "none",
    fontWeight: 600,
    letterSpacing: "0.03em",
  } as const,

  modalText: {
    margin: 0,
    fontSize: "14px",
    color: "var(--text-primary)",
    lineHeight: 1.5,
  } as const,
};
