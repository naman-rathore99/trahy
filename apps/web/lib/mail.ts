import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "bookings@shubhyatra.world";

export async function sendOtpEmail(to: string, code: string) {
  if (!to) return;

  try {
    await resend.emails.send({
      from: `Shubh Yatra Security <${process.env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject: `${code} is your Verification Code`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px;">
          <h2 style="color: #e11d48; text-align: center;">Shubh Yatra</h2>
          <p style="text-align: center; color: #555;">Use the code below to verify your email address.</p>
          
          <div style="background: #f4f4f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #18181b;">${code}</span>
          </div>

          <p style="text-align: center; color: #888; font-size: 12px;">This code will expire in 10 minutes.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("OTP Email Failed:", error);
    return { success: false, error };
  }
}

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
      <a href="https://shubhyatra.world" style="background-color: #e11d48; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Explore Stays</a>
    `;

  try {
    await resend.emails.send({
      from: `Shubh Yatra <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #e11d48;">Shubh Yatra</h1>
          ${message}
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center;">
            Mathura, Uttar Pradesh, India • <a href="https://shubhyatra.world" style="color: #888;">shubhyatra.world</a>
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
