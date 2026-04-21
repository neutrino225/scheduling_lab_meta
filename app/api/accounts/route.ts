import { apiError, apiSuccess, API_ERRORS } from "@/lib/api/errors";
import { listAccounts } from "@/lib/accounts/service";

export async function GET() {
  try {
    const accounts = await listAccounts();
    const sanitizedAccounts = accounts.map((account) => {
      const token = account.accessToken || "";
      const suffix = token.length >= 4 ? token.slice(-4) : token;

      return {
        ...account,
        accessToken: token ? `***${suffix}` : null,
      };
    });

    return apiSuccess(sanitizedAccounts);
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return apiError(
      API_ERRORS.INTERNAL_ERROR.code,
      "Failed to fetch accounts",
      API_ERRORS.INTERNAL_ERROR.status
    );
  }
}
