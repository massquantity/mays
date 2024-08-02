import { clsx, type ClassValue } from 'clsx';
import { customAlphabet } from 'nanoid';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
);

interface FetchOptions {
  method: string;
  headers?: Record<string, string>;
  body: string | FormData;
  timeout?: number;
}

export async function fetchWIthTimeout(url: string, options: FetchOptions) {
  const { timeout = 10_000 } = options; // 10 seconds
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeout}ms`);
    }
    throw error;
  }
}
