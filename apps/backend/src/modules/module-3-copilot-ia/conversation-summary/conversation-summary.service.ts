import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import { SummarizeConversationDto } from './dto/summarize-conversation.dto';

@Injectable()
export class ConversationSummaryService {
  private readonly ai: GoogleGenAI;

  constructor(private readonly config: ConfigService) {
    this.ai = new GoogleGenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY'),
    });
  }

  async summarize(dto: SummarizeConversationDto): Promise<{ paragraphs: string[] }> {
    const response = await this.ai.models.generateContent({
      model: this.config.get<string>('GEMINI_MODEL') ?? 'gemini-3-flash-preview',
      contents: `Résume ce flux d'échanges (emails ou compte-rendu de réunion) en exactement 3 paragraphes courts et clairs, en français : le premier paragraphe résume le contexte/sujet, le deuxième les points clés discutés, le troisième les prochaines étapes ou décisions.\n\nÉchanges à résumer :\n"""\n${dto.text}\n"""`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            paragraphs: {
              type: Type.ARRAY,
              minItems: '3',
              maxItems: '3',
              items: { type: Type.STRING },
            },
          },
          required: ['paragraphs'],
        },
      },
    });

    if (!response.text) {
      return { paragraphs: [] };
    }
    return JSON.parse(response.text) as { paragraphs: string[] };
  }
}
