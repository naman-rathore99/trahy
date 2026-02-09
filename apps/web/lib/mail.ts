import { Resend } from "resend";

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// 🛡️ CRITICAL FIX: Fallback to Resend's testing domain if your env variable is broken or missing.
// If you have a verified domain (e.g., info@shubhyatra.world), set RESEND_FROM_EMAIL in your .env file.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

/**
 * 1. Send OTP Verification Email
 */
export async function sendOtpEmail(to: string, code: string) {
  if (!to) return;

  try {
    console.log(`Sending OTP to ${to} from ${FROM_EMAIL}...`);

    await resend.emails.send({
      from: `Shubh Yatra Security <${FROM_EMAIL}>`,
      to: [to],
      subject: `${code} is your Verification Code`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px;">
          <h2 style="color: #e11d48; text-align: center; margin-bottom: 10px;">Shubh Yatra</h2>
          <p style="text-align: center; color: #555; margin-bottom: 20px;">Use the code below to verify your email address.</p>
          
          <div style="background: #f4f4f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #18181b;">${code}</span>
          </div>

          <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("OTP Email Failed:", error);
    return { success: false, error };
  }
}

/**
 * 2. Send Welcome Email (User or Partner)
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  role: "user" | "partner",
) {
  if (!to) return;

  const isPartner = role === "partner";

  const subject = isPartner
    ? "Welcome to Shubh Yatra Partner Program! 🤝"
    : "Welcome to Shubh Yatra! 🙏";

  const message = isPartner
    ? `
      <p>Namaste <strong>${name}</strong>,</p>
      <p>Welcome to the <strong>Shubh Yatra Partner Family</strong>.</p>
      <p>We are thrilled to have you onboard. Your account is currently <strong>Pending Verification</strong>.</p>
      <p>Our team will review your details and approve your account shortly so you can start listing your properties/vehicles.</p>
      <p>If you have any questions, reply to this email.</p>
    `
    : `
      <p>Namaste <strong>${name}</strong>,</p>
      <p>Welcome to <strong>Shubh Yatra</strong> — your gateway to a spiritual journey in Mathura & Vrindavan.</p>
      <p>You can now book the best stays, rental vehicles, and spiritual experiences directly from our platform.</p>
      <p>We are here to make your yatra comfortable and memorable.</p>
      <br/>
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://shubhyatra.world" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explore Stays</a>
      </div>
    `;

  try {
    await resend.emails.send({
      from: `Shubh Yatra <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h1 style="color: #e11d48; text-align: center;">Shubh Yatra</h1>
          <div style="padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            ${message}
          </div>
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
            Mathura, Uttar Pradesh, India • <a href="https://shubhyatra.world" style="color: #e11d48; text-decoration: none;">shubhyatra.world</a>
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Welcome Email Failed:", error);
    return { success: false, error };
  }
}

/**
 * 3. Send Invoice / Booking Confirmation Email
 */
export async function sendInvoiceEmail(
  to: string,
  bookingDetails: {
    id: string;
    hotelName: string;
    amount: string;
    date: string;
    guests: number;
  },
) {
  if (!to) return;

  try {
    await resend.emails.send({
      from: `Shubh Yatra Bookings <${FROM_EMAIL}>`,
      to: [to],
      subject: `Booking Confirmed: ${bookingDetails.hotelName} (ID: ${bookingDetails.id})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 10px;">
          <h2 style="color: #e11d48; border-bottom: 2px solid #e11d48; padding-bottom: 10px; margin-bottom: 20px;">Booking Confirmed</h2>
          <p>Namaste,</p>
          <p>Your stay at <strong>${bookingDetails.hotelName}</strong> has been confirmed.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background: #f4f4f5;">
              <td style="padding: 12px; border: 1px solid #ddd; width: 40%;">Booking ID</td>
              <td style="padding: 12px; border: 1px solid #ddd;"><strong>#${bookingDetails.id}</strong></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd;">Date</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${bookingDetails.date}</td>
            </tr>
            <tr style="background: #f4f4f5;">
              <td style="padding: 12px; border: 1px solid #ddd;">Guests</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${bookingDetails.guests}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd;">Total Paid</td>
              <td style="padding: 12px; border: 1px solid #ddd; color: #10b981; font-weight: bold; font-size: 16px;">₹${bookingDetails.amount}</td>
            </tr>
          </table>

          <div style="margin-top: 30px; text-align: center;">
            <a href="https://shubhyatra.world/bookings/${bookingDetails.id}" style="background-color: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Booking Details</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
            Thank you for choosing Shubh Yatra.
          </p>
        </div>
      `,
    });
    console.log(
      `Invoice email sent to ${to} for booking #${bookingDetails.id}`,
    );
    return { success: true };
  } catch (error) {
    console.error("Invoice Email Failed:", error);
    return { success: false, error };
  }
}
