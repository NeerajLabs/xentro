import { NextRequest, NextResponse } from 'next/server';
import { sendZohoEmail } from '@/lib/email/zohoDispatcher';

const INTERNAL_DISPATCH_SECRET = process.env.EMAIL_DISPATCH_SECRET || 'xentro-internal-email-dispatch-key-2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, text, message, secret } = body;

    // Verify authentication secret
    const authHeader = req.headers.get('x-xentro-dispatch-secret');
    if (secret !== INTERNAL_DISPATCH_SECRET && authHeader !== INTERNAL_DISPATCH_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized email dispatch request' },
        { status: 401 }
      );
    }

    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid recipient email is required' },
        { status: 400 }
      );
    }

    const emailSubject = subject || 'Your XENTRO Verification Code';
    const emailBody = text || message || '';

    await sendZohoEmail({
      to: to.trim().toLowerCase(),
      subject: emailSubject,
      text: emailBody,
    });

    return NextResponse.json({
      success: true,
      message: `Email dispatched successfully to ${to}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to dispatch email via Zoho SMTP',
        error: error?.message || 'Unknown SMTP error',
      },
      { status: 500 }
    );
  }
}
