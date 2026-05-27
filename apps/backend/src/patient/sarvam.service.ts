import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class SarvamService {
  private readonly apiKey = process.env.SARVAM_API_KEY;
  private readonly apiUrl = 'https://api.sarvam.ai/text-to-speech/stream';

  async streamTextToSpeech(text: string, res: Response, lang: string = 'hi-IN') {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'api-subscription-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        target_language_code: lang,
        speaker: 'shubh',
        model: 'bulbul:v3',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Sarvam API error: ${JSON.stringify(errorData)}`);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    
    // Node.js stream handling
    const reader = response.body.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value)); 
      }
    } finally {
      res.end();
    }
  }
}