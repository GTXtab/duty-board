export class GoogleApiError extends Error {
  constructor(readonly status: number) {
    super(`Google API request failed with status ${status}`);
    this.name = 'GoogleApiError';
  }
}

interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly body?: object;
}

export const googleRequest = async (
  token: string,
  url: string,
  { method = 'GET', body }: RequestOptions = {},
): Promise<unknown> => {
  const response = await fetch(url, {
    method,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && { 'Content-Type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new GoogleApiError(response.status);
  return response.status === 204 ? null : response.json();
};

export const isRecord = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;
