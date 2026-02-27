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
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background: #0f172a;">
      <div style="max-width: 480px; margin: 0 auto; background: #020617; border-radius: 16px; padding: 24px; border: 1px solid #1f2937;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
          <div style="width:28px; height:28px; border-radius:999px; background:#4f46e5; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:12px; font-weight:700;">
            PN
          </div>
          <span style="font-size:12px; color:#9ca3af;">PayNidhi Security</span>
        </div>
        <h1 style="font-size:20px; color:#e5e7eb; margin:0 0 8px;">Confirm it’s you</h1>
        <p style="font-size:13px; color:#9ca3af; margin:0 0 16px;">
          Use the one-time verification code below to continue. This code expires in 5 minutes.
        </p>
        <div style="text-align:center; margin:24px 0;">
          <div style="display:inline-flex; letter-spacing:8px; font-size:22px; font-weight:700; padding:10px 18px; border-radius:999px; background:rgba(55,65,81,0.7); color:#f9fafb; border:1px solid rgba(148,163,184,0.6);">
            ${code}
          </div>
        </div>
        <p style="font-size:11px; color:#6b7280; margin:0 0 4px;">
          Didn’t request this? You can safely ignore this email.
        </p>
        <p style="font-size:11px; color:#4b5563; margin:0;">
          © ${new Date().getFullYear()} PayNidhi · Secure access
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