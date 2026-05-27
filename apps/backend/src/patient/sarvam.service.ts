import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SarvamService {
  private readonly apiKey = process.env.SARVAM_API_KEY;
  private readonly apiUrl = 'https://api.sarvam.ai/text-to-speech';

  async convertTextToSpeech(text: string, language: string = 'hi-IN'): Promise<string> {
    try {
      // FIX 1: Provide the actual request body inside the post() method
      const response = await axios.post(this.apiUrl, {
        text: text,
        target_language_code: language,
        speaker: 'Shruti',
      }, {
        headers: {
          'api-subscription-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log("FULL SARVAM RESPONSE:", JSON.stringify(response.data, null, 2));

      return response.data.audio_url || response.data.url || response.data.data?.audio_url;
    } catch (error: unknown) {
      // FIX 2: Cast the error to an 'any' or check its type so TS allows access to properties
      const err = error as any; 
      console.error("Sarvam API Error:", err.response?.data || err.message || err);
      throw error;
    }
  }
}