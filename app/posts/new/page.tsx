import { listAccounts } from "@/lib/accounts/service";
import { CreatePostForm } from "@/components/create-post-form";
import { AppShell } from "@/components/app-shell";
import type { Account } from "@/lib/client/types";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const accountsRows = await listAccounts();
  const accounts = accountsRows as unknown as Account[];

  return (
    <AppShell>
      <div className="page-header" style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", fontWeight: 600, margin: 0, letterSpacing: "var(--tracking-heading)" }}>Create Post</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", marginTop: "0.25rem" }}>
          Build and schedule your Meta content.
        </p>
      </div>

      <CreatePostForm initialAccounts={accounts} />
    </AppShell>
  );
}
