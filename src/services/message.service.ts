import { createClient } from '@supabase/supabase-js';
import { IChannelAdapter, OutboundMessage } from './adapters/channel.adapter';
import { TelegramAdapter } from './adapters/telegram.adapter';
import { WhapiAdapter } from './adapters/whapi.adapter';

// ─── Adapter Registry ────────────────────────────────────────────────────────
const adapterRegistry = new Map<string, IChannelAdapter>();

function registerAdapter(adapter: IChannelAdapter) {
  adapterRegistry.set(adapter.channel, adapter);
}

if (process.env.TELEGRAM_BOT_TOKEN) {
  registerAdapter(new TelegramAdapter(process.env.TELEGRAM_BOT_TOKEN, 'telegram'));
}
if (process.env.TELEGRAM_BOT_TOKEN_GASTRO) {
  registerAdapter(new TelegramAdapter(process.env.TELEGRAM_BOT_TOKEN_GASTRO, 'telegram_gastro'));
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class MessageService {
  /**
   * Send a channel-agnostic message.
   *
   * @param channel         'whatsapp' | 'telegram' | 'telegram_gastro' | ...
   * @param tenant_id       Required for WhatsApp
   * @param sender_phone_id Required for multi-number WhatsApp (the origin channel ID)
   * @param chat_id         Recipient address
   */
  static async sendMessage(params: {
    channel: string;
    tenant_id?: string;
    sender_phone_id?: string;
    chat_id: string | number;
    text: string;
    buttons?: string[];
    removeKeyboard?: boolean;
    requestContact?: boolean;
    contactButtonLabel?: string;
  }): Promise<void> {
    const message: OutboundMessage = {
      to: String(params.chat_id),
      text: params.text,
      buttons: params.buttons,
      removeKeyboard: params.removeKeyboard,
      requestContact: params.requestContact,
      contactButtonLabel: params.contactButtonLabel,
    };

    if (params.channel === 'whatsapp') {
      await MessageService._sendWhatsApp(params.tenant_id!, message, params.sender_phone_id);
    } else {
      const adapter = adapterRegistry.get(params.channel);
      if (!adapter) {
        console.error(`[MessageService] No adapter registered for channel: "${params.channel}"`);
        return;
      }
      await adapter.send(message);
    }
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private static async _sendWhatsApp(tenantId: string, message: OutboundMessage, phoneId?: string): Promise<void> {
    // Fetch per-tenant Whapi token from DB
    // If phoneId is provided, use it to pick the exact account. 
    // Otherwise fallback to the first one available for the tenant.
    
    let query = supabaseAdmin
      .from('whatsapp_accounts')
      .select('access_token')
      .eq('tenant_id', tenantId);
    
    if (phoneId) {
      query = query.eq('phone_number_id', phoneId);
    }
    
    const { data: waAccount, error } = await query.limit(1).maybeSingle();

    if (error || !waAccount) {
      console.error(`[MessageService] WhatsApp credentials not found for tenant ${tenantId}${phoneId ? ` (Phone: ${phoneId})` : ''}:`, error?.message);
      return;
    }

    const adapter = new WhapiAdapter(waAccount.access_token);
    await adapter.send(message);
  }

  static buttons(labels: string[]): Pick<Parameters<typeof MessageService.sendMessage>[0], 'buttons'> {
    return { buttons: labels };
  }

  static removeKeyboard(): Pick<Parameters<typeof MessageService.sendMessage>[0], 'removeKeyboard'> {
    return { removeKeyboard: true };
  }

  static contactButton(label: string): Pick<Parameters<typeof MessageService.sendMessage>[0], 'requestContact' | 'contactButtonLabel'> {
    return { requestContact: true, contactButtonLabel: label };
  }
}
