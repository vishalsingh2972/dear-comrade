import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class InsightService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  async getFriendlySummary(anomalies: string[], lang: string = 'hi-IN') {
    try {
      if (anomalies.length === 0) return "आपकी रिपोर्ट सामान्य है!"; // Hindi for "Looks great"

      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Force Hindi output in the prompt
      const prompt = `Explain these lab anomalies in a simple, friendly, one-sentence way for a patient. 
IMPORTANT: Respond ONLY in Hindi (Devanagari script). 
Anomalies: ${anomalies.join(', ')}.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini failed:", error);
      return "आपकी रिपोर्ट में कुछ विसंगतियां हैं। कृपया अपने डॉक्टर से परामर्श करें।"; // Hindi fallback
    }
  }
}