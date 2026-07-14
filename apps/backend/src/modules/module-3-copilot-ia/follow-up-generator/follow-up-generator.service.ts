import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface FollowUpEmail {
  subject: string;
  body: string;
}

@Injectable()
export class FollowUpGeneratorService {
  private readonly ai: GoogleGenAI;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY'),
    });
  }

  async generate(contactId: string): Promise<FollowUpEmail> {
    const contact = await this.prisma.db.contact.findUnique({
      where: { id: contactId },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!contact) {
      throw new NotFoundException('Contact introuvable.');
    }

    const lastActivity = contact.activities[0];
    const daysSinceLastContact = lastActivity
      ? Math.floor((Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const context = lastActivity
      ? `Dernier échange il y a ${daysSinceLastContact} jour(s) : "${lastActivity.content}"`
      : "Aucun échange enregistré avec ce contact pour l'instant.";

    const prompt = `Tu rédiges un email de relance professionnel en français pour un(e) freelance/agence qui utilise un CRM.
Contact : ${contact.firstName} ${contact.lastName ?? ''} (${contact.company ?? 'entreprise non renseignée'}).
Contexte : ${context}
Rédige un email de relance court, personnalisé, chaleureux mais professionnel, qui fait référence au contexte ci-dessus. Termine par une question ouverte ou un appel à l'action clair.`;

    const response = await this.ai.models.generateContent({
      model: this.config.get<string>('GEMINI_MODEL') ?? 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ['subject', 'body'],
        },
      },
    });

    if (!response.text) {
      throw new Error("La generation de l'email de relance a echoue.");
    }
    return JSON.parse(response.text) as FollowUpEmail;
  }
}
