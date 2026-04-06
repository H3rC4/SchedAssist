import { IChannelAdapter, OutboundMessage } from './channel.adapter';

/**
 * Whapi.Cloud adapter for WhatsApp messaging.
 *
 * This is the ONLY file that knows about Whapi.Cloud's API surface.
 * To switch providers (e.g. to Meta Cloud API or Baileys), create a new
 * adapter implementing IChannelAdapter and register it in message.service.ts.
 */
export class WhapiAdapter implements IChannelAdapter {
  readonly channel = 'whatsapp';

  private static readonly BASE_URL = 'https://gate.whapi.cloud';

  constructor(private readonly accessToken: string) {}

  async send(message: OutboundMessage): Promise<void> {
    const cleanPhone = message.to.replace('@c.us', '').replace(/\D/g, '');

    // WhatsApp has no native free-form keyboards — render buttons as numbered list
    let body = message.text;
    if (message.buttons && message.buttons.length > 0) {
      body += '\n\n' + message.buttons.map((b, i) => `${i + 1}. ${b}`).join('\n');
    }

    const response = await fetch(`${WhapiAdapter.BASE_URL}/messages/text`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: cleanPhone, body }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`WhapiAdapter error: ${err.error || err.message || response.statusText}`);
    }
  }
}
