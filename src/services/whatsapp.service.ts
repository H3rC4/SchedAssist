/**
 * @deprecated
 * This file is kept only for backward compatibility during the transition.
 * All WhatsApp messaging now goes through:
 *   src/services/adapters/whapi.adapter.ts  ← provider implementation
 *   src/services/message.service.ts         ← routing layer
 *
 * Do NOT add new direct usages of this class.
 */

export class WhatsAppService {
  /** @deprecated Use MessageService.sendMessage({ channel: 'whatsapp', ... }) instead */
  static async sendTextMessage(_params: { accessToken: string; to: string; text: string }) {
    throw new Error('WhatsAppService is deprecated. Use MessageService instead.');
  }
}
