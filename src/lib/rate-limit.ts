import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting usando Upstash Redis
 * Funciona correctamente en Vercel serverless (cada función comparte el mismo Redis)
 *
 * Variables de entorno requeridas:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * Si no están configuradas, retorna null (rate limiting deshabilitado en dev)
 */

// Cliente Redis de Upstash
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis !== null) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "⚠️ Upstash Redis no configurado. Rate limiting deshabilitado."
    );
    return null;
  }

  redis = new Redis({
    url,
    token,
  });

  return redis;
}

/**
 * Rate limit general: 100 requests por minuto por IP
 */
export const generalRateLimit = new Ratelimit({
  redis: getRedis() as Redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  prefix: "ratelimit:general",
});

/**
 * Rate limit estricto para endpoints de auth: 10 requests por minuto por IP
 * Previene brute force en login/register/forgot-password
 */
export const authRateLimit = new Ratelimit({
  redis: getRedis() as Redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:auth",
});

/**
 * Verifica rate limit y retorna respuesta 429 si excede
 * @param identifier - IP o identificador único
 * @param type - Tipo de rate limit (general o auth)
 * @returns NextResponse con 429 si excede, null si está OK
 */
export async function checkRateLimit(
  identifier: string,
  type: "general" | "auth" = "general"
) {
  const limiter = type === "auth" ? authRateLimit : generalRateLimit;
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
