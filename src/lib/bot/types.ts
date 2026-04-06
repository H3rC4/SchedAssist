import { SupabaseClient } from '@supabase/supabase-js';

export interface BotContext {
  supabase: SupabaseClient;
  tenant: any;
  client: any;
  chatId: number | string;
  sender_phone_id?: string; // For multi-number WhatsApp (the Whapi channel ID)
  text: string;
  msgLower: string;
  botState: any;
  message: any;
  /**
   * The messaging channel this message arrived on.
   * Examples: 'whatsapp' | 'telegram' | 'telegram_gastro'
   * Passed through to MessageService so the engine never needs to know
   * which provider is being used.
   */
  channel: string;
}
