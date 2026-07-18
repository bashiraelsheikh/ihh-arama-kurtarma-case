"use client";

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function apiPost<T = unknown>(url: string, body: unknown): Promise<ApiResult<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResult<T>;
  return json;
}

export async function apiGet<T = unknown>(url: string): Promise<ApiResult<T>> {
  const res = await fetch(url, { method: "GET" });
  return (await res.json()) as ApiResult<T>;
}
