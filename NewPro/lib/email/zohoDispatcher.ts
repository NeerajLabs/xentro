import tls from 'node:tls';

interface SendZohoEmailOptions {
  to: string;
  subject: string;
  text: string;
}

// Fallback Zoho credentials if not configured in platform environment variables
const FALLBACK_ZOHO_PASS = Buffer.from('eTBKVkIycDloS2JF', 'base64').toString('utf8');

/**
 * Dispatches transactional email directly through Zoho Mail SMTP over SSL (Port 465).
 * Uses Node.js native TLS socket for maximum reliability on serverless / Vercel functions.
 */
export function sendZohoEmail({ to, subject, text }: SendZohoEmailOptions): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const host = process.env.EMAIL_HOST || 'smtp.zoho.in';
    const port = parseInt(process.env.EMAIL_PORT || '465', 10);
    const user = process.env.EMAIL_HOST_USER || 'no-reply@xentro.in';
    const pass = process.env.EMAIL_HOST_PASSWORD || FALLBACK_ZOHO_PASS;

    const socket = tls.connect(port, host, { timeout: 8000 }, () => {
      socket.setTimeout(8000);
    });
    let step = 0;
    let settled = false;
    socket.setEncoding('utf8');

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    };

    socket.on('data', (rawChunk) => {
      if (settled) return;
      const chunk = rawChunk.toString();
      const trimmed = chunk.trim();
      const code = trimmed.substring(0, 3);

      // Immediately reject and close socket on any SMTP error response (4xx or 5xx)
      if (code.startsWith('4') || code.startsWith('5')) {
        return finish(new Error(`Zoho SMTP error [${code}]: ${trimmed}`));
      }

      if (step === 0 && (code === '220' || chunk.includes('220 '))) {
        step = 1;
        socket.write('EHLO xentro.in\r\n');
      } else if (step === 1 && (code === '250' || chunk.includes('250 '))) {
        step = 2;
        socket.write('AUTH LOGIN\r\n');
      } else if (step === 2 && (code === '334' || chunk.includes('334'))) {
        step = 3;
        socket.write(Buffer.from(user).toString('base64') + '\r\n');
      } else if (step === 3 && (code === '334' || chunk.includes('334'))) {
        step = 4;
        socket.write(Buffer.from(pass).toString('base64') + '\r\n');
      } else if (step === 4 && (code === '235' || chunk.includes('235'))) {
        step = 5;
        socket.write(`MAIL FROM:<${user}>\r\n`);
      } else if (step === 5 && (code === '250' || chunk.includes('250'))) {
        step = 6;
        socket.write(`RCPT TO:<${to}>\r\n`);
      } else if (step === 6 && (code === '250' || chunk.includes('250'))) {
        step = 7;
        socket.write('DATA\r\n');
      } else if (step === 7 && (code === '354' || chunk.includes('354'))) {
        step = 8;
        const msg = [
          `From: "Xentro Security" <${user}>`,
          `To: <${to}>`,
          `Subject: ${subject}`,
          'Content-Type: text/plain; charset=UTF-8',
          '',
          text,
          '.\r\n'
        ].join('\r\n');
        socket.write(msg);
      } else if (step === 8 && (code === '250' || chunk.includes('250'))) {
        step = 9;
        try {
          socket.write('QUIT\r\n');
        } catch {
          // ignore
        }
        finish();
      }
    });

    socket.on('error', (err) => {
      finish(err);
    });

    socket.on('timeout', () => {
      finish(new Error('Zoho SMTP connection timed out'));
    });
  });
}
