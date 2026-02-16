import { Resend } from "resend";

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// Fallback to Resend's testing domain if env var is missing
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "onboarding@shubhyatra.world";

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
 * ✅ UPDATED: Handles "Default Password" vs "Custom Password" logic
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  role: "user" | "partner",
  password?: string,
) {
  if (!to) return;

  const isPartner = role === "partner";
  const subject = isPartner
    ? "🎉 Partner Account Approved - Shubh Yatra"
    : "Welcome to Shubh Yatra! 🙏";

  let message = "";

  if (isPartner) {
    // 🔴 LOGIC: Check if using Default Password or Custom
    const isDefaultPassword = password === "Partner@123";

    if (isDefaultPassword) {
      // CASE A: Default Password -> Show it with RED WARNING
      message = `
        <p>Namaste <strong>${name}</strong>,</p>
        <p>Congratulations! Your request to join <strong>Shubh Yatra</strong> has been <strong>APPROVED</strong>.</p>
        
        <p>You can now login to your dashboard using the temporary credentials below:</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #333;"><strong>Login Details:</strong></p>
          <p style="margin: 0;">📧 Email: ${to}</p>
          <p style="margin: 5px 0 0 0;">🔑 Password: <strong>${password}</strong></p>
        </div>

        <div style="background-color: #fef2f2; color: #b91c1c; padding: 15px; border-radius: 8px; border: 1px solid #fca5a5; text-align: center; margin-bottom: 20px;">
          <strong>⚠️ IMPORTANT: Please change this password immediately after your first login.</strong>
        </div>

        <div style="text-align: center;">
          <a href="https://admin.shubhyatra.world/login" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Partner Dashboard</a>
        </div>
      `;
    } else {
      // CASE B: Custom Password -> Hide it, say "We will text you"
      message = `
        <p>Namaste <strong>${name}</strong>,</p>
        <p>Congratulations! Your request to join <strong>Shubh Yatra</strong> has been <strong>APPROVED</strong>.</p>
        
        <p>Your partner account is ready. For security reasons, we do not send custom passwords via email.</p>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe; margin: 20px 0; text-align: center;">
          <p style="color: #1e40af; margin: 0; font-weight: bold; font-size: 16px;">
            📱 We will text or WhatsApp you the login details shortly.
          </p>
        </div>

        <p>Once you receive your credentials, please login to complete your property setup.</p>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://admin.shubhyatra.world/login" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        </div>
      `;
    }
  } else {
    // Standard User Welcome
    message = `
      <p>Namaste <strong>${name}</strong>,</p>
      <p>Welcome to <strong>Shubh Yatra</strong> — your gateway to a spiritual journey in Mathura & Vrindavan.</p>
      <p>You can now book the best stays, rental vehicles, and spiritual experiences directly from our platform.</p>
      <br/>
      <div style="text-align: center;">
        <a href="https://shubhyatra.world" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explore Stays</a>
      </div>
    `;
  }

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
    return { success: true };
  } catch (error) {
    console.error("Invoice Email Failed:", error);
    return { success: false, error };
  }
}

/**
 * 4. Send Password Reset Email
 */
export async function sendPasswordResetEmail(to: string, resetLink: string) {
  if (!to) return;

  try {
    await resend.emails.send({
      from: `Shubh Yatra Security <${FROM_EMAIL}>`,
      to: [to],
      subject: "Reset your Shubh Yatra Password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 40px 20px;">
          <h2 style="color: #e11d48; text-align: center; margin-bottom: 20px;">Shubh Yatra</h2>
          
          <div style="text-align: center;">
             <img src="https://img.icons8.com/clouds/100/000000/lock-landscape.png" alt="Reset Password" style="margin-bottom: 20px;" />
          </div>

          <p style="text-align: center; color: #333; font-size: 16px;">
            Hello,
          </p>
          <p style="text-align: center; color: #555; font-size: 14px; line-height: 1.5;">
            We received a request to reset the password for your Shubh Yatra account.<br/>
            If you didn't ask for this, you can safely ignore this email.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #e11d48; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            Or copy this link: <br/>
            <a href="${resetLink}" style="color: #e11d48;">${resetLink}</a>
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Reset Email Failed:", error);
    return { success: false, error };
  }
}
