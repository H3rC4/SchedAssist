import { IChannelAdapter, OutboundMessage } from './channel.adapter';

/**
 * Telegram Bot API adapter.
 *
 * This is the ONLY file that knows about Telegram's API surface.
 * To add a second Telegram bot (e.g. per-tenant tokens), instantiate
 * a new TelegramAdapter with a different token and register it.
 */
export class TelegramAdapter implements IChannelAdapter {
  readonly channel: string;

  private static readonly BASE_URL = 'https://api.telegram.org';

  /**
   * @param token   The Telegram Bot token (TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN_GASTRO)
   * @param channel A unique channel identifier, e.g. 'telegram' or 'telegram_gastro'
   */
  constructor(private readonly token: string, channel = 'telegram') {
    this.channel = channel;
  }

  async send(message: OutboundMessage): Promise<void> {
    const chatId = Number(message.to);
    const payload: Record<string, unknown> = { chat_id: chatId, text: message.text, parse_mode: 'HTML' };

    if (message.removeKeyboard) {
      payload.reply_markup = { remove_keyboard: true };
    } else if (message.requestContact) {
      payload.reply_markup = {
        keyboard: [[{ text: message.contactButtonLabel ?? 'Compartir contacto', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      };
    } else if (message.buttons && message.buttons.length > 0) {
      payload.reply_markup = {
        keyboard: message.buttons.map((b) => [{ text: b }]),
        resize_keyboard: true,
        one_time_keyboard: true,
      };
    }

    const response = await fetch(`${TelegramAdapter.BASE_URL}/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`TelegramAdapter error: ${err.description || response.statusText}`);
    }
  }
}
