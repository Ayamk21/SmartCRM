const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface ApiFetchOptions extends RequestInit {
  accessToken?: string | null;
}

export async function apiFetch<T>(
  path: string,
  { accessToken, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message = body?.message ?? "Une erreur est survenue.";
    throw new ApiError(Array.isArray(message) ? message[0] : message, res.status);
  }

  return body as T;
}
