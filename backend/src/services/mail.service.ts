import nodemailer from 'nodemailer';

export class MailService {

  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `http://localhost:4200/reset-password?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Patitas - Recuperar contraseña',
      text: `Hola, solicitaste recuperar tu contraseña.

Ingresá al siguiente enlace para crear una nueva:
${resetUrl}

El enlace vence en 15 minutos.

Si no solicitaste este cambio, ignorá este correo.`
    });
  }


}
