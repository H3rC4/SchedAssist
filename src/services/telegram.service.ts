/**
 * @deprecated
 * This file is kept only for backward compatibility during the transition.
 * All Telegram messaging now goes through:
 *   src/services/adapters/telegram.adapter.ts  ← provider implementation
 *   src/services/message.service.ts            ← routing layer
 *
 * Do NOT add new direct usages of this class.
 */

export class TelegramService {
  /** @deprecated Use MessageService.sendMessage({ channel: 'telegram', ... }) instead */
  static async sendMessage(_params: { chat_id: number; text: string; reply_markup?: any }) {
    throw new Error('TelegramService is deprecated. Use MessageService instead.');
  }

  /** @deprecated */
  static getReplyKeyboard(_options: string[]) {
    throw new Error('TelegramService is deprecated. Use MessageService instead.');
  }

  /** @deprecated */
  static getRemoveKeyboard() {
    throw new Error('TelegramService is deprecated. Use MessageService instead.');
  }

  /** @deprecated */
  static getContactKeyboard(_buttonText: string) {
    throw new Error('TelegramService is deprecated. Use MessageService instead.');
  }
}
