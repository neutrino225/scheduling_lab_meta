"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getApiData } from "@/lib/client/api";
import type { Account } from "@/lib/client/types";
import "@/app/components.css";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getApiData<Account[]>("/api/accounts");
        if (active) setAccounts(data);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", margin: 0 }}>Accounts</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: "0.25rem 0 1rem" }}>
        Connected Meta accounts ({accounts.length})
      </p>

      <div className="card">
        {loading ? (
          <div style={{ padding: "1.25rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-row" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>No connected accounts.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Platform</th>
                  <th>Page ID</th>
                  <th>Token</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td style={{ textTransform: "capitalize" }}>{a.platform}</td>
                    <td className="mono">{a.pageId || a.igUserId || "—"}</td>
                    <td className="mono" style={{ color: "var(--text-muted)" }}>{a.accessToken || "—"}</td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {a.tokenExpiresAt ? new Date(a.tokenExpiresAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
