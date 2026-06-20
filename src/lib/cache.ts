// Server-side caching utilities for frequently accessed, rarely changed data
// Uses Next.js unstable_cache with revalidation

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export const getTenantBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('tenants')
      .select('id, name, slug, timezone, settings, plan_tier, subscription_status')
      .eq('slug', slug)
      .single()
    return data
  },
  ['tenant-by-slug'],
  { revalidate: 3600 } // 1 hour
)

export const getTenantById = unstable_cache(
  async (id: string) => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('tenants')
      .select('id, name, slug, timezone, settings, plan_tier, subscription_status')
      .eq('id', id)
      .single()
    return data
  },
  ['tenant-by-id'],
  { revalidate: 3600 }
)
