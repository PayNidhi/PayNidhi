<p align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/3135/3135706.png" width="80"/>
</p>

<h1 align="center">💸 PayNidhi</h1>

<p align="center">
  An Escrow-Backed B2B Invoice Discounting Marketplace  
</p>

<p align="center">
  <i>Built for Project Morpheus 2026</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stack-MERN-blue?logo=mongodb"/>
  <img src="https://img.shields.io/badge/Status-Hackathon_MVP-success"/>
</p>

---

## 🚨 The Problem Statement: Invoice Financing for MSMEs(FT004)

Micro, Small, and Medium Enterprises (MSMEs) form the backbone of the Indian economy, yet they are systematically starved of working capital. The root of this crisis lies in the standard B2B supply chain payment cycle. 

When an MSME (the Seller) delivers goods or services to a large corporate enterprise (the Buyer), they do not get paid immediately. Instead, they are issued an invoice with a maturity period of 60 to 90 days. 

This creates a massive operational bottleneck:

1. **The Working Capital Trap:** The MSME has money locked up in unpaid invoices, leaving them unable to pay employee salaries, buy new raw materials, or take on new orders. Their growth is entirely paralyzed until the corporate buyer decides to clear the invoice.

2. **The Trust Deficit in Traditional Factoring:** While invoice discounting exists, it is plagued by fraud. "Ghost invoices" (fake billing) and "double-dipping" (pledging the same invoice to multiple banks) make it incredibly risky for independent lenders to finance these businesses.

3. **Cash Leakage:** Even if a lender finances an MSME, there is no guarantee the corporate buyer won't just pay the MSME's original bank account 90 days later, leaving the lender chasing the MSME for repayment.

---

## 💡 The Solution: PayNidhi

PayNidhi solves the MSME liquidity crisis by transforming unpaid invoices into liquid assets through a trustless, legally-enforced marketplace.

We connect cash-strapped Sellers with institutional and retail Lenders, wrapped in an automated legal layer that completely removes the credit risk from the lender.

### Key Innovations:

* **The Legal Lock (Notice of Assignment):** Before any funds are disbursed, PayNidhi automatically generates a legally binding Notice of Assignment (NOA) under the Factoring Regulation Act, 2011. This legally forces the corporate buyer to redirect their 90-day payment directly to our nodal account.

* **Escrow Settlement Engine:** PayNidhi operates entirely on an escrow model. Money never touches the platform's or the MSME's private bank accounts directly.

* **Automated 3-Way Split:** When the invoice matures, our backend mathematical engine automatically splits the incoming corporate funds—returning principal and interest to the Lender, taking a 2% platform fee, and routing the remainder to the Seller.

---

## 🛠 Technologies Used

| Technology | Details |
|----------|--------|
| Frontend | React.js, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Payments & Escrow | Razorpay API Integration |
| Security | JWT-based Role Authentication (Admin, Seller, Lender) |

---

## 👥 The Team

* **Sanket Bochare**  
* **Prathamesh Ingle**  
* **Kartik Shivankar**  
* **Gaurav Patil**

---

<p align="center">
  <i>Note: This project was built from scratch within a 24-hour sprint.</i>
</p>
