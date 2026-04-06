/**
 * A normalized outbound message payload, channel-agnostic.
 * The engine always sends this shape; adapters translate it to their provider's format.
 */
export interface OutboundMessage {
  /** The recipient identifier (phone number, Telegram chat_id, etc.) */
  to: string;
  text: string;
  /**
   * Optional list of button labels to present to the user.
   * Each adapter renders buttons in its own way:
   * - Telegram: ReplyKeyboardMarkup
   * - WhatsApp (Whapi): numbered list appended to text (WA has no free keyboards)
   */
  buttons?: string[];
  /**
   * If true, instructs the adapter to remove any existing keyboard/buttons.
   * Adapters that don't support keyboards can safely ignore this.
   */
  removeKeyboard?: boolean;
  /**
   * If true, instructs the adapter to request a phone number contact share.
   * Only relevant for channels that support native contact sharing (Telegram).
   */
  requestContact?: boolean;
  /** Label for the contact-share button (used when requestContact is true) */
  contactButtonLabel?: string;
}

/**
 * Contract that every messaging channel adapter must fulfill.
 * Adding a new provider (e.g. Meta Cloud API, Baileys, Twilio) is as simple as
 * implementing this interface — zero changes to engine.ts or business logic required.
 */
export interface IChannelAdapter {
  /**
   * The channel identifier. Used by MessageService to select the correct adapter.
   * Examples: 'whatsapp', 'telegram'
   */
  readonly channel: string;

  /** Send a normalized message through this channel. */
  send(message: OutboundMessage): Promise<void>;
}
