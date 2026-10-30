import { QueryClient, useQuery } from "@tanstack/react-query";
let csrf = "";
export async function api(url: string, options: RequestInit = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch("/api" + url, {
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      "X-CSRF-Token": csrf,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  if (data.csrf) csrf = data.csrf;
  return data;
}
export const post = (url: string, data: unknown) =>
  api(url, { method: "POST", body: JSON.stringify(data) });
export const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
export function useData(key: string, url: string, enabled = true) {
  return useQuery<any>({
    queryKey: [key, url],
    queryFn: () => api(url),
    enabled,
  });
}
export const date = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not assigned";
export const label = (s: string) =>
  s
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
