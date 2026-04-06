import { IChannelAdapter, OutboundMessage } from './channel.adapter';

/**
 * Official Meta WhatsApp Cloud API Adapter.
 * Handles text messages and interactive list messages (buttons).
 */
export class MetaAdapter implements IChannelAdapter {
  readonly channel = 'whatsapp';

  /**
   * @param accessToken Permanent Access Token from Meta Developer Console
   * @param phoneNumberId Phone Number ID from Meta WhatsApp Setup
   */
  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string
  ) {}

  async send(message: OutboundMessage): Promise<void> {
    const API_VERSION = 'v19.0';
    const url = `https://graph.facebook.com/${API_VERSION}/${this.phoneNumberId}/messages`;

    let payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.to.replace(/\D/g, ''), // Clean the phone number
    };

    // If buttons are present, use 'interactive' type (List Message)
    if (message.buttons && message.buttons.length > 0) {
      payload.type = 'interactive';
      payload.interactive = {
        type: 'list',
        header: {
          type: 'text',
          text: 'Selecciona una opción'
        },
        body: {
          text: message.text
        },
        footer: {
          text: 'SchedAssist AI Assistant'
        },
        action: {
          button: 'Ver Opciones',
          sections: [
            {
              title: 'Opciones Disponibles',
              rows: message.buttons.map((btn, index) => ({
                id: (index + 1).toString(),
                title: btn.length > 24 ? btn.substring(0, 21) + '...' : btn,
                description: btn.length > 24 ? btn : undefined
              }))
            }
          ]
        }
      };
    } else {
      // Standard text message
      payload.type = 'text';
      payload.text = {
        body: message.text,
        preview_url: true
      };
    }

    console.log(`[MetaAdapter] Sending ${payload.type} to ${message.to}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[MetaAdapter] Error sending message:', error);
      throw new Error(`Meta API error: ${error.error?.message || response.statusText}`);
    }

    console.log('[MetaAdapter] Message sent successfully via Meta.');
  }
}
