import tls from 'node:tls';

interface SendZohoEmailOptions {
  to: string;
  subject: string;
  text: string;
}

/**
 * Dispatches transactional email directly through Zoho Mail SMTP over SSL (Port 465).
 * Uses Node.js native TLS socket for maximum reliability on serverless / Vercel functions.
 */
export function sendZohoEmail({ to, subject, text }: SendZohoEmailOptions): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const host = process.env.EMAIL_HOST || 'smtp.zoho.in';
    const port = parseInt(process.env.EMAIL_PORT || '465', 10);
    const user = process.env.EMAIL_HOST_USER || 'no-reply@xentro.in';
    const pass = process.env.EMAIL_HOST_PASSWORD || 'y0JVB2p9hKbE';

    const socket = tls.connect(port, host, { timeout: 15000 });
    let step = 0;
    socket.setEncoding('utf8');

    socket.on('data', (chunk) => {
      const code = chunk.substring(0, 3);
      if (step === 0 && code === '220') {
        step = 1;
        socket.write('EHLO xentro.in\r\n');
      } else if (step === 1 && code === '250') {
        step = 2;
        socket.write('AUTH LOGIN\r\n');
      } else if (step === 2 && code === '334') {
        step = 3;
        socket.write(Buffer.from(user).toString('base64') + '\r\n');
      } else if (step === 3 && code === '334') {
        step = 4;
        socket.write(Buffer.from(pass).toString('base64') + '\r\n');
      } else if (step === 4 && code === '235') {
        step = 5;
        socket.write(`MAIL FROM:<${user}>\r\n`);
      } else if (step === 5 && code === '250') {
        step = 6;
        socket.write(`RCPT TO:<${to}>\r\n`);
      } else if (step === 6 && code === '250') {
        step = 7;
        socket.write('DATA\r\n');
      } else if (step === 7 && code === '354') {
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
      } else if (step === 8 && code === '250') {
        step = 9;
        socket.write('QUIT\r\n');
        resolve(true);
      }
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Zoho SMTP connection timed out'));
    });
  });
}
