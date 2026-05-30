import { Resend } from 'resend';

// Initialize Resend client if API key is available
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

export class EmailService {
  /**
   * Send an email using Resend
   * @param to Recipient email address
   * @param subject Email subject
   * @param html HTML content of the email
   * @param text Plain text content (optional)
   */
  static async sendAppointmentConfirmation(
    to: string,
    appointmentId: string,
    patientName: string,
    professionalName: string,
    date: string,
    time: string,
    cancellationLink: string,
    tenantName: string,
    tenantSettings: any
  ) {
    // If Resend is not configured, log and return (fail silently in dev)
    if (!resend) {
      console.warn('[EmailService] Resend not configured - skipping email send');
      console.log(`[EmailService] Would send to: ${to}`);
      console.log(`[EmailService] Subject: Appointment Confirmation for ${tenantName}`);
      return { success: false, error: 'Email service not configured' };
    }

    try {
      // Get brand colors from tenant settings or use defaults
      const primaryColor = tenantSettings?.primary_color || '#005c55';
      const secondaryColor = tenantSettings?.secondary_color || '#855300';

      // Email template
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${primaryColor}; margin: 0; font-size: 24px;">${tenantName}</h1>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Appointment Confirmation</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #191c1e; margin-top: 0; font-size: 20px;">Your Appointment is Confirmed</h2>
            <p style="color: #444; margin: 16px 0; line-height: 1.6;">
              Hello <strong>${patientName}</strong>,<br><br>
              Your appointment has been successfully booked:
            </p>
            <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #666; min-width: 80px;">Date:</span>
                <span style="color: #191c1e;">${date}</span>
              </p>
              <p style="margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #666; min-width: 80px;">Time:</span>
                <span style="color: #191c1e;">${time}</span>
              </p>
              <p style="margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #666; min-width: 80px;">Professional:</span>
                <span style="color: #191c1e;">${professionalName}</span>
              </p>
            </div>
          </div>
          
          <div style="background: #fff3cd; border: 1px sharp solid #ffeaa7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #856404; font-weight: 600;">Important:</p>
            <p style="margin: 0; color: #856404; font-size: 14px;">
              To cancel or reschedule your appointment, use the link below:<br>
              <a href="${cancellationLink}" style="color: #005c55; text-decoration: underline;">
                ${cancellationLink}
              </a>
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${cancellationLink}" 
               style="background: ${secondaryColor}; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 600; 
                      display: inline-block; font-size: 14px;">
              Cancel or Reschedule Appointment
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated message, please do not reply.</p>
            <p>If you need assistance, contact ${tenantName} directly.</p>
          </div>
        </div>
      `;

      const text = `
        ${tenantName} - Appointment Confirmation
        
        Hello ${patientName},
        
        Your appointment has been successfully booked:
        Date: ${date}
        Time: ${time}
        Professional: ${professionalName}
        
        To cancel or reschedule your appointment, use this link:
        ${cancellationLink}
        
        This is an automated message, please do not reply.
      `;

      const data = await resend.emails.send({
        from: `${tenantName} <appointments@${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '')}>`,
        to: [to],
        subject: `Appointment Confirmed - ${tenantName}`,
        html: html,
        text: text
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('[EmailService] Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a generic email (for future use)
   */
  static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ) {
    if (!resend) {
      console.warn('[EmailService] Resend not configured - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const data = await resend.emails.send({
        from: `SchedAssist <appointments@${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '')}>`,
        to: [to],
        subject: subject,
        html: html,
        text: text
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('[EmailService] Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }
}