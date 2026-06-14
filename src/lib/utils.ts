import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"

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
 * Uses crypto.randomBytes() in Node.js (server-side)
 * Falls back to crypto.getRandomValues() in browser environments
 * Both are cryptographically secure
 */
export function generateCancellationToken(): string {
  // Server-side: use Node.js crypto
  if (typeof window === 'undefined') {
    return crypto.randomBytes(16).toString('hex')
  }
  
  // Client-side: use Web Crypto API
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback (should never happen in modern environments)
  return crypto.randomBytes(16).toString('hex')
}