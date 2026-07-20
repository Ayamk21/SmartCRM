import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.fromEmail = this.config.get<string>('GMAIL_USER') ?? '';
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        user: this.fromEmail,
        pass: this.config.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({ from: this.fromEmail, to, subject, html });
      return true;
    } catch (error) {
      this.logger.error(`Echec de l'envoi d'email a ${to}`, error as Error);
      return false;
    }
  }

  async sendPasswordResetOtpEmail(to: string, code: string): Promise<boolean> {
    return this.send(
      to,
      'Ton code de verification Smart CRM Copilot',
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Code de verification</h2>
          <p>Voici ton code pour reinitialiser ton mot de passe :</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; text-align: center; padding: 16px; background: #f3f4f6; border-radius: 8px;">${code}</p>
          <p>Ce code expire dans 10 minutes. Si tu n'as pas demande cette reinitialisation, ignore cet email.</p>
        </div>
      `,
    );
  }

  async sendAccountApprovedEmail(to: string, tenantName: string, tempPassword: string) {
    await this.send(
      to,
      'Votre compte Smart CRM Copilot a ete approuve',
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Bienvenue sur Smart CRM Copilot 👋</h2>
          <p>Votre workspace <strong>${tenantName}</strong> a ete approuve.</p>
          <p>Voici vos identifiants de connexion :</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; background: #f3f4f6;"><strong>Email</strong></td>
              <td style="padding: 8px; background: #f3f4f6;">${to}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Mot de passe temporaire</strong></td>
              <td style="padding: 8px; font-family: monospace;">${tempPassword}</td>
            </tr>
          </table>
          <p>Ce mot de passe est temporaire : il vous sera demande de le changer des votre premiere connexion.</p>
          <a href="${this.frontendUrl}/login" style="display:inline-block; margin-top: 12px; padding: 10px 16px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none;">Se connecter</a>
        </div>
      `,
    );
  }

  async sendTeamInviteEmail(
    to: string,
    tenantName: string,
    role: string,
    tempPassword: string,
  ) {
    await this.send(
      to,
      `Invitation a rejoindre ${tenantName} sur Smart CRM Copilot`,
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Tu as ete invite(e) 👋</h2>
          <p>Tu as ete ajoute(e) au workspace <strong>${tenantName}</strong> avec le role <strong>${role}</strong>.</p>
          <p>Voici tes identifiants de connexion :</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; background: #f3f4f6;"><strong>Email</strong></td>
              <td style="padding: 8px; background: #f3f4f6;">${to}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Mot de passe temporaire</strong></td>
              <td style="padding: 8px; font-family: monospace;">${tempPassword}</td>
            </tr>
          </table>
          <p>Ce mot de passe est temporaire : il te sera demande de le changer des ta premiere connexion.</p>
          <a href="${this.frontendUrl}/login" style="display:inline-block; margin-top: 12px; padding: 10px 16px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none;">Se connecter</a>
        </div>
      `,
    );
  }

  async sendAccountRejectedEmail(to: string, tenantName: string, reason: string) {
    await this.send(
      to,
      'Votre demande d\'inscription Smart CRM Copilot',
      `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Demande non retenue</h2>
          <p>Votre demande d'inscription pour <strong>${tenantName}</strong> n'a pas ete approuvee.</p>
          <p><strong>Motif :</strong> ${reason}</p>
          <p>Vous pouvez soumettre une nouvelle demande apres correction, ou contacter le support pour plus d'informations.</p>
        </div>
      `,
    );
  }
}
