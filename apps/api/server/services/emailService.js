let nodemailer = null;
try {
  // eslint-disable-next-line global-require
  nodemailer = require('nodemailer');
} catch (_error) {
  nodemailer = null;
}

class EmailService {
  constructor(config = {}) {
    this.config = {
      smtpHost: config.smtpHost ?? '',
      smtpPort: Number(config.smtpPort ?? 587),
      smtpSecure: config.smtpSecure === true,
      smtpUser: config.smtpUser ?? '',
      smtpPass: config.smtpPass ?? '',
      from: config.from ?? 'noreply@localhost',
      appBaseUrl: config.appBaseUrl ?? 'http://localhost:5173',
    };

    this.deliveryReady = Boolean(
      nodemailer && this.config.smtpHost && this.config.smtpUser && this.config.smtpPass,
    );

    this.transporter = this.deliveryReady
      ? nodemailer.createTransport({
          host: this.config.smtpHost,
          port: this.config.smtpPort,
          secure: this.config.smtpSecure,
          auth: {
            user: this.config.smtpUser,
            pass: this.config.smtpPass,
          },
        })
      : null;
  }

  isDeliveryReady() {
    return this.deliveryReady;
  }

  buildVerificationUrl(token) {
    return `${this.config.appBaseUrl.replace(/\/$/, '')}/#account?verifyToken=${encodeURIComponent(token)}`;
  }

  buildPasswordResetUrl(token) {
    return `${this.config.appBaseUrl.replace(/\/$/, '')}/#reset-password?token=${encodeURIComponent(token)}`;
  }

  async sendVerificationEmail({ to, name, token, expiresAt }) {
    const verifyUrl = this.buildVerificationUrl(token);
    const subject = 'Verify your email';
    const text = [
      `Hi ${name || 'there'},`,
      'Please verify your account email by clicking the link below:',
      verifyUrl,
      `This link expires on ${new Date(expiresAt).toISOString()}.`,
    ].join('\n');

    if (!this.deliveryReady || !this.transporter) {
      return { delivered: false, mode: 'dev', previewUrl: verifyUrl };
    }

    await this.transporter.sendMail({ from: this.config.from, to, subject, text });
    return { delivered: true, mode: 'smtp' };
  }

  async sendPasswordResetEmail({ to, name, token, expiresAt }) {
    const resetUrl = this.buildPasswordResetUrl(token);
    const subject = 'Password reset request';
    const text = [
      `Hi ${name || 'there'},`,
      'We received a request to reset your password.',
      'Use the link below to set a new password:',
      resetUrl,
      `This link expires on ${new Date(expiresAt).toISOString()}.`,
      'If you did not request this change, you can ignore this email.',
    ].join('\n');

    if (!this.deliveryReady || !this.transporter) {
      return { delivered: false, mode: 'dev', previewUrl: resetUrl };
    }

    await this.transporter.sendMail({ from: this.config.from, to, subject, text });
    return { delivered: true, mode: 'smtp' };
  }
}

module.exports = { EmailService };
