import { ApiError, ApiSuccess } from "@/lib/client/types";

async function toErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as ApiError;
    return body.message || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function getApiData<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await toErrorMessage(response));
  }

  const payload = (await response.json()) as ApiSuccess<T>;
  return payload.data;
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await toErrorMessage(response));
  }

  const payload = (await response.json()) as ApiSuccess<T>;
  return payload.data;
}

export async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await toErrorMessage(response));
  }

  const payload = (await response.json()) as ApiSuccess<T>;
  return payload.data;
}

export async function deleteApiData<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await toErrorMessage(response));
  }

  const payload = (await response.json()) as ApiSuccess<T>;
  return payload.data;
}
