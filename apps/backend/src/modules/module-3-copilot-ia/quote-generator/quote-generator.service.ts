import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import { GenerateQuoteDto } from './dto/generate-quote.dto';

export interface QuoteLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

@Injectable()
export class QuoteGeneratorService {
  private readonly ai: GoogleGenAI;

  constructor(private readonly config: ConfigService) {
    this.ai = new GoogleGenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY'),
    });
  }

  async generate(dto: GenerateQuoteDto): Promise<QuoteLine[]> {
    const response = await this.ai.models.generateContent({
      model: this.config.get<string>('GEMINI_MODEL') ?? 'gemini-3-flash-preview',
      contents: `Analyse cette demande d'un freelance/agence et extrait les lignes de devis structurées (description, quantité, prix unitaire estimé en euros). Si un prix n'est pas mentionné, estime un prix raisonnable pour une prestation freelance/agence en France. Demande : "${dto.prompt}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                },
                required: ['description', 'quantity', 'unitPrice'],
              },
            },
          },
          required: ['lines'],
        },
      },
    });

    if (!response.text) {
      return [];
    }
    const parsed = JSON.parse(response.text) as { lines: QuoteLine[] };
    return parsed.lines ?? [];
  }
}
