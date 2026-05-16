import { listAccounts } from "@/lib/accounts/service";
import { AccountsContent } from "@/components/accounts-content";
import type { Account } from "@/lib/client/types";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accountsRows = await listAccounts();
  const initialAccounts = accountsRows as unknown as Account[];

  return <AccountsContent initialAccounts={initialAccounts} />;
}
