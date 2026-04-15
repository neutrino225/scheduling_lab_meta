import { apiError, apiSuccess, API_ERRORS } from "@/lib/api/errors";
import { listAccounts } from "@/lib/accounts/service";

export async function GET() {
  try {
    const accounts = await listAccounts();
    return apiSuccess(accounts);
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return apiError(
      API_ERRORS.INTERNAL_ERROR.code,
      "Failed to fetch accounts",
      API_ERRORS.INTERNAL_ERROR.status
    );
  }
}
