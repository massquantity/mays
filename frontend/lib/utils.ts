import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FetchOptions {
  method: string;
  headers?: Record<string, string>;
  body: string;
  timeout?: number;
}

export async function fetchWIthTimeout(url: string, options: FetchOptions) {
  const { timeout = 10_000 } = options;  // 10 seconds
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}
