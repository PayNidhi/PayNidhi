import dotenv from "dotenv";
dotenv.config();

// Helper to handle the API request
const sendViaBrevo = async (to, subject, htmlContent) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY, // Ensure this exists in your .env
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "PayNidhi Security", email: process.env.GMAIL_USER },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Brevo API Error:", errorData);
    throw new Error("Failed to send email via Brevo");
  }
  console.log(`✅ Email sent successfully to: ${to}`);
};

// Functions remain identical to your old ones to ensure compatibility
export const sendOtpEmail = async ({ to, code }) => {
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; padding: 40px 20px; background-color: #f3f4f6;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
        <h1 style="color: #111827; font-size: 24px; font-weight: 700; text-align: center;">Verify your identity</h1>
        <p style="text-align: center; margin: 20px 0;">Your verification code is:</p>
        <div style="text-align: center; font-size: 36px; font-weight: bold; color: #10b981;">${code}</div>
      </div>
    </div>
  `;
  await sendViaBrevo(to, "Your PayNidhi verification code", html);
};

export const sendInvoiceVerificationMailToBuyer = async ({ to, token, invoice, seller }) => {
  const baseUrl = process.env.BACKEND_URL || "http://localhost:5001";
  
  const html = `
    <div style="font-family: system-ui, sans-serif; padding: 40px; background-color: #f8fafc;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 32px; border-radius: 16px;">
        <h1 style="font-size: 20px;">Action Required: Verify Invoice</h1>
        <p>Your vendor, <strong>${seller?.companyName}</strong>, has uploaded an invoice.</p>
        <a href="${baseUrl}/api/invoice/verify-invoice?token=${token}&verify=true" 
           style="display: block; padding: 14px; background-color: #10b981; color: white; text-align: center; text-decoration: none; border-radius: 8px;">
          Confirm & Verify Invoice
        </a>
      </div>
    </div>
  `;
  await sendViaBrevo(to, `Verify Invoice #${invoice?.invoiceNumber}`, html);
};