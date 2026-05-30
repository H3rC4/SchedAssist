import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Generate a URL-safe random token for cancellation links
 * Uses crypto.getRandomValues for browser environments
 * Falls back to Math.random for SSR if crypto not available
 */
export function generateCancellationToken(): string {
  // Try to use crypto API if available (client-side)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for server-side or older environments
  // This is not cryptographically secure but acceptable for cancellation tokens
  // as they are single-use and short-lived
  return Array.from({length: 16}, () => Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, '0')).join('')
}