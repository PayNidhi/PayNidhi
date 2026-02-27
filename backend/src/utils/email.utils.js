// backend/src/utils/email.utils.js
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});


export const sendOtpEmail = async ({ to, code }) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; background-color: #f3f4f6;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
        
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 50px; height: 50px; background-color: #d1fae5; color: #059669; border-radius: 12px; font-size: 20px; font-weight: bold; line-height: 50px; margin-bottom: 12px;">
            PN
          </div>
          <div style="color: #10b981; font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
            PayNidhi Security
          </div>
        </div>

        <h1 style="color: #111827; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 16px;">
          Verify your identity
        </h1>
        
        <p style="color: #4b5563; font-size: 15px; text-align: center; margin: 0 0 32px; line-height: 1.6;">
          Please enter the verification code below to securely access your account. This code will expire in 5 minutes.
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 36px; font-weight: 800; letter-spacing: 12px; padding: 16px 32px; border-radius: 8px;">
            ${code}
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 0 0 24px;" />

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0 0 8px; line-height: 1.5;">
          If you didn't request this code, you can safely ignore this email.
        </p>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} PayNidhi. All rights reserved.
        </p>
        
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"PayNidhi Security" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your PayNidhi verification code",
    html,
  });
};


// THE FIX: Added 'invoice' and 'seller' to the destructured parameters!
export const sendInvoiceVerificationMailToBuyer = async ({ to, token, invoice, seller }) => {
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px 20px; background-color: #f8fafc; color: #334155;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
        
        <div style="padding: 24px; border-bottom: 1px solid #e2e8f0; text-align: center; background-color: #f8fafc;">
          <h2 style="margin: 0; font-size: 24px; color: #0f8f79; font-weight: 800; letter-spacing: -0.5px;">PayNidhi</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Escrow Verification</p>
        </div>

        <div style="padding: 32px 24px;">
          <h1 style="font-size: 20px; color: #0f172a; margin: 0 0 16px; font-weight: 700;">Action Required: Verify Invoice</h1>
          <p style="font-size: 15px; color: #475569; margin: 0 0 24px; line-height: 1.6;">
            Your vendor, <strong>${seller?.companyName || "your vendor"}</strong>, has uploaded an invoice to the PayNidhi platform for discounting. Please confirm that the goods/services have been received and this invoice is valid.
          </p>

          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 0 0 12px; color: #64748b;">Invoice Number</td>
                <td style="padding: 0 0 12px; color: #0f172a; text-align: right; font-weight: 600;">${invoice?.invoiceNumber || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 0 0 12px; color: #64748b;">Invoice Date</td>
                <td style="padding: 0 0 12px; color: #0f172a; text-align: right; font-weight: 600;">${invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 0 0 12px; color: #64748b;">Due Date</td>
                <td style="padding: 0 0 12px; color: #0f172a; text-align: right; font-weight: 600;">${invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0; border-top: 1px dashed #cbd5e1; color: #64748b; font-weight: 500;">Total Amount</td>
                <td style="padding: 12px 0 0; border-top: 1px dashed #cbd5e1; color: #0f8f79; text-align: right; font-size: 18px; font-weight: 700;">${invoice?.totalAmount ? formatCurrency(invoice.totalAmount) : "₹0"}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center;">
            <a href="http://localhost:5001/api/invoice/verify-invoice?token=${token}&verify=true" 
               style="display: block; width: 100%; padding: 14px 0; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin-bottom: 12px; text-align: center;">
              Confirm & Verify Invoice
            </a>
            
            <a href="http://localhost:5001/api/invoice/verify-invoice?token=${token}&verify=false" 
               style="display: block; width: 100%; padding: 14px 0; background-color: #ffffff; color: #ef4444; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; border: 1px solid #fca5a5; text-align: center;">
              Reject / Report Issue
            </a>
          </div>
        </div>

        <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 12px; color: #64748b; margin: 0 0 8px; line-height: 1.5;">
            If you did not expect this email, please contact your vendor immediately or click reject.
          </p>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            © ${new Date().getFullYear()} PayNidhi Escrow Services
          </p>
        </div>
        
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"PayNidhi Security" <${process.env.GMAIL_USER}>`,
    to,
    // THE FIX 2: A much more professional, dynamic subject line
    subject: `Action Required: Verify Invoice #${invoice?.invoiceNumber} from ${seller?.companyName}`,
    html,
  });

  console.log("final confirmation token: ", token)
  console.log("mail sent successfully... to: ", to);
};