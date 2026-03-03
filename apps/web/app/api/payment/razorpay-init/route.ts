import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminDb } from "@/lib/firebaseAdmin";

// Make sure to add these to your Vercel/Next.js .env file!
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SMqEDdCPzDQyX3",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "CLEOuMFuSshprLGBMCkmKMkD",
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { totalAmount, bookingId, userId, customerName, customerEmail, customerPhone } = body;

        if (!totalAmount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        // 1. Create the Order securely on Razorpay's servers
        const amountInPaise = Math.round(Number(totalAmount) * 100);

        const orderOptions = {
            amount: amountInPaise,
            currency: "INR",
            receipt: bookingId || `rcpt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(orderOptions);

        // 2. Return the Order ID to the mobile app
        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });

    } catch (error: any) {
        console.error("❌ Razorpay Init Error:", error);
        return NextResponse.json(
            { error: "Failed to initialize Razorpay", details: error.message },
            { status: 500 }
        );
    }
}