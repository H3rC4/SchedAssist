import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting usando Upstash Redis
 * Compatible con Edge Runtime (middleware) y Node.js (API routes)
 *
 * Variables de entorno requeridas:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * Si no están configuradas, el rate limiting se deshabilita silenciosamente.
 */

// Lazy initialization - solo se crea cuando se necesita
let _ratelimit: Ratelimit | null = null;
let _authRatelimit: Ratelimit | null = null;
let _initialized = false;

function getRateLimiters() {
  if (_initialized) return { ratelimit: _ratelimit, authRatelimit: _authRatelimit };

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // En desarrollo sin Redis, rate limiting se deshabilita
    _initialized = true;
    return { ratelimit: null, authRatelimit: null };
  }

  try {
    const redis = new Redis({ url, token });

    // Rate limit general: 100 requests por minuto por IP
    _ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "60 s"),
      analytics: true,
      prefix: "ratelimit:general",
    });

    // Rate limit estricto para auth: 10 requests por minuto por IP
    _authRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "ratelimit:auth",
    });
  } catch (err) {
    console.warn("⚠️ No se pudo inicializar Upstash Redis:", err);
  }

  _initialized = true;
  return { ratelimit: _ratelimit, authRatelimit: _authRatelimit };
}

/**
 * Verifica rate limit y retorna respuesta 429 si excede
 * Si Redis no está configurado, permite todas las requests (desarrollo)
 */
export async function checkRateLimit(
  identifier: string,
  type: "general" | "auth" = "general"
): Promise<{ blocked: false } | { blocked: true; response: Response }> {
  const { ratelimit, authRatelimit } = getRateLimiters();
  const limiter = type === "auth" ? authRatelimit : ratelimit;

  // Si no hay Redis configurado, permitir todo (modo desarrollo)
  if (!limiter) {
    return { blocked: false };
  }

  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    return {
      blocked: true,
      response: new Response(
        JSON.stringify({
          error: "Too many requests",
          limit,
          reset: new Date(reset).toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      ),
    };
  }

  return { blocked: false };
}
