import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: Twilio;
  private readonly fromNumber: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Twilio(
      this.config.get<string>('TWILIO_ACCOUNT_SID'),
      this.config.get<string>('TWILIO_AUTH_TOKEN'),
    );
    this.fromNumber = this.config.get<string>('TWILIO_PHONE_NUMBER') ?? '';
  }

  async sendOtpSms(to: string, code: string): Promise<void> {
    try {
      await this.client.messages.create({
        from: this.fromNumber,
        to,
        body: `Smart CRM Copilot : ton code de verification est ${code}. Il expire dans 10 minutes.`,
      });
    } catch (error) {
      this.logger.error(`Echec de l'envoi du SMS a ${to}`, error as Error);
      throw error;
    }
  }
}
