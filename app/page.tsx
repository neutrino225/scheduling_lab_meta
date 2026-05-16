import { listPostsWithDetails } from "@/lib/posts/service";
import { listAccounts } from "@/lib/accounts/service";
import { DashboardContent } from "@/components/dashboard-content";
import type { PostWithDetails, Account } from "@/lib/client/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [postsRows, accountsRows] = await Promise.all([
    listPostsWithDetails({ limit: 50 }),
    listAccounts(),
  ]);

  // Cast to client types
  const posts = postsRows as unknown as PostWithDetails[];
  const accounts = accountsRows as unknown as Account[];

  return <DashboardContent posts={posts} accounts={accounts} />;
}
