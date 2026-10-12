import nodemailer from 'nodemailer';
import type { AppEnv } from '../config/env.js';

export interface AuthDeliveryProvider {
  sendEmailVerification(input: { email: string; token: string }): Promise<void>;
  sendPasswordReset(input: { email: string; token: string }): Promise<void>;
}

export class LogAuthDeliveryProvider implements AuthDeliveryProvider {
  constructor(private readonly env: AppEnv, private readonly log: (data: Record<string, unknown>, message: string) => void) {}
  async sendEmailVerification(input: { email: string; token: string }) {
    const verificationUrl = `${this.env.PUBLIC_APP_URL.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(input.token)}`;
    this.log({ email: input.email, verificationUrl }, 'Development-only email verification link');
  }
  async sendPasswordReset(input: { email: string; token: string }) {
    const resetUrl = `${this.env.PUBLIC_APP_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(input.token)}`;
    this.log({ email: input.email, resetUrl }, 'Development-only password reset link');
  }
}

export class SmtpAuthDeliveryProvider implements AuthDeliveryProvider {
  private readonly transport;
  constructor(private readonly env: AppEnv) {
    this.transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
    });
  }

  async sendEmailVerification(input: { email: string; token: string }) {
    const url = `${this.env.PUBLIC_APP_URL.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(input.token)}`;
    await this.transport.sendMail({
      from: this.env.SMTP_FROM,
      to: input.email,
      subject: 'Verify your ElectrooBuddy email',
      text: `Verify your email: ${url}`
    });
  }

  async sendPasswordReset(input: { email: string; token: string }) {
    const url = `${this.env.PUBLIC_APP_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(input.token)}`;
    await this.transport.sendMail({
      from: this.env.SMTP_FROM,
      to: input.email,
      subject: 'Reset your ElectrooBuddy password',
      text: `Reset your password: ${url}`
    });
  }
}

export function createAuthDeliveryProvider(env: AppEnv, log: (data: Record<string, unknown>, message: string) => void): AuthDeliveryProvider {
  return env.AUTH_DELIVERY_MODE === 'smtp' ? new SmtpAuthDeliveryProvider(env) : new LogAuthDeliveryProvider(env, log);
}
