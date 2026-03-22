export class PapersClient {
  private readonly host: string;
  private readonly token: string;

  constructor() {
    const host = process.env.PAPERS_HOST;
    const token = process.env.PAPERS_TOKEN;

    if (!host) throw new Error("PAPERS_HOST environment variable is required");
    if (!token) throw new Error("PAPERS_TOKEN environment variable is required");

    this.host = host.replace(/\/$/, "");
    this.token = token;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.host}/api${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const err = await response.json() as { message?: string };
        message = err.message ?? message;
      } catch {
        // ignore
      }
      throw new Error(`Papers API error: ${message}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as T;
  }

  get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const params = query
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(query)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : "";
    return this.request<T>("GET", params ? `${path}?${params}` : path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  delete<T = void>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}
