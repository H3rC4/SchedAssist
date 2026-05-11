import { createClient } from '@supabase/supabase-js';

/**
 * Check if the bot is currently paused for a given client.
 * 
 * The bot is considered paused if:
 * - client.notes.manual_takeover === true
 * - AND less than 30 minutes have passed since last_interaction
 * 
 * Returns false if client not found, notes are missing/corrupt, or takeover expired.
 */
export async function isBotPaused(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  phone: string
): Promise<boolean> {
  const { data: client } = await supabase
    .from('clients')
    .select('notes')
    .eq('tenant_id', tenantId)
    .eq('phone', phone)
    .maybeSingle() as any;

  if (!client?.notes) return false;

  try {
    const notes = JSON.parse(client.notes);
    if (notes.manual_takeover !== true) return false;
    
    const lastInteraction = notes.last_interaction || 0;
    const minutesSince = (Date.now() - lastInteraction) / 60000;
    return minutesSince < 30;
  } catch (_) {
    return false;
  }
}
