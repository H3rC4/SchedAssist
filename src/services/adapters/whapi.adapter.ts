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
    // Whapi requiere el formato [numero]@s.whatsapp.net para chats privados
    // o [id]@g.us para grupos.
    let to = message.to;
    if (!to.includes('@')) {
      // Limpiar el número y agregar el sufijo correcto
      const cleanPhone = to.replace(/\D/g, '');
      to = `${cleanPhone}@s.whatsapp.net`;
    }

    // WhatsApp no tiene teclados libres nativos - renderizar botones como lista numerada
    // O usar el endpoint de Polls si se prefiere (más estable que interactive)
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
      body: JSON.stringify({ 
        to: to, 
        body: body,
        typing_time: 0 // Envío inmediato
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`WhapiAdapter error: ${err.error || err.message || response.statusText}`);
    }
  }
}
