import { Resend } from 'resend';

// Vercel will automatically inject RESEND_API_KEY from your project settings
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userEmail, userName, userPhone, pdfBase64, fileName } = req.body;

  if (!userEmail || !pdfBase64) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  try {
    const data = await resend.emails.send({
      from: 'Homez Analysis <reports@homezbuyers.com.au>',
      to: [userEmail],
      cc: ['admin@homezbuyers.com.au'], // Sends a copy to your Microsoft account
      subject: `Investment Strategy Analysis: ${userName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #FFFCED; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color: #064E2C; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-family: 'Georgia', serif; letter-spacing: -0.5px; font-size: 24px;">HOMEZ</h1>
              <p style="color: #C6A672; margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">Buyers Advocacy</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 32px;">
              <h2 style="color: #064E2C; margin-top: 0; font-family: 'Georgia', serif;">Strategy Report Ready</h2>
              <p style="color: #555555; line-height: 1.6; font-size: 16px;">Hi ${userName},</p>
              <p style="color: #555555; line-height: 1.6; font-size: 16px;">Thank you for using the <strong>Homez Wealth Projection Engine (HWPE)</strong>.</p>
              <p style="color: #555555; line-height: 1.6; font-size: 16px;">Your comprehensive property investment analysis has been generated and is attached to this email. This report includes:</p>
              <ul style="color: #555555; line-height: 1.6; font-size: 15px; padding-left: 20px;">
                <li style="margin-bottom: 8px;">30-Year Wealth Velocity Projections</li>
                <li style="margin-bottom: 8px;">Detailed Cashflow & Tax Analysis</li>
                <li style="margin-bottom: 8px;">Capital Growth Forecasts</li>
              </ul>
              
              <!-- Call to Action -->
              <div style="margin-top: 35px; text-align: center;">
                <p style="font-family: 'Georgia', serif; font-size: 16px; color: #064E2C; margin-bottom: 20px; line-height: 1.5;">
                   <strong>Next Steps:</strong> <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #555; font-weight: normal;">If you would like to discuss this strategy with a Senior Buyer's Advocate.</span>
                </p>
                <a href="https://outlook.office365.com/book/InitialConsultation@NETORG16333069.onmicrosoft.com/" style="background-color: #064E2C; color: #ffffff; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 1px; display: inline-block;">BOOK STRATEGY CALL</a>
                <p style="color: #999; font-size: 12px; margin-top: 15px;">Review your results with a Senior Property Strategist.</p>
              </div>

              <!-- Registration / Lead Capture Details for Admin Visibility -->
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #e5e7eb; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                 <h3 style="font-size: 11px; color: #C6A672; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; font-weight: 900;">User Contact Details</h3>
                 <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #666; width: 80px;">Name:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #064E2C; font-weight: bold;">${userName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #666;">Email:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #333;">${userEmail}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #666;">Phone:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #333;">${userPhone || '<span style="color:#999; font-style:italic;">Not Provided</span>'}</td>
                    </tr>
                 </table>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f3f4f6; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} Homez Buyers Advocacy. All rights reserved.</p>
              <p style="font-size: 11px; color: #9ca3af; margin: 12px 0 0 0; font-style: italic;">Please do not reply to this email. This inbox is automated for report generation and is not monitored.</p>
              
              <!-- Legal Disclaimer -->
              <div style="margin-top: 25px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: justify;">
                  <p style="font-size: 10px; color: #9ca3af; font-weight: bold; margin: 0 0 10px 0; text-align: center;">Homez Buyer's Advocacy Pty Ltd © Notice & Disclaimer</p>
                  <p style="font-size: 9px; color: #a1a1aa; line-height: 1.5; margin: 0 0 10px 0;">
                    THIS E-MAIL IS CONFIDENTIAL. If you have received this e-mail in error, please notify us by return e-mail and delete the document. If you are not the intended recipient you are hereby notified that any disclosure, copying, distribution or taking any action in reliance on the contents of this information is strictly prohibited and may be unlawful. Homez Buyers Advocacy is not liable for the proper and complete transmission of the information contained in this communication or for any delay in its receipt.
                  </p>
                  <p style="font-size: 9px; color: #a1a1aa; line-height: 1.5; margin: 0;">
                    The sender believes that this E-mail and any attachments were free of any virus, worm, Trojan horse, and/or malicious code when sent. This message and its attachments could have been infected during transmission. By reading the message and opening any attachments, the recipient accepts full responsibility for taking protective and remedial action about viruses and other defects. The sender's employer is not liable for any loss or damage arising in any way from this message or its attachments.
                  </p>
              </div>

              <p style="font-size: 10px; color: #d1d5db; margin: 20px 0 0 0; text-transform: uppercase;">Generated by HWPE Engine v3.0</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ],
    });

    return res.status(200).json({ success: true, id: data.data?.id });
  } catch (error: any) {
    console.error("Resend Error:", error);
    return res.status(500).json({ error: error.message });
  }
}