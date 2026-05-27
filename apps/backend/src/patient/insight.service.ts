import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class InsightService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  async getFriendlySummary(anomalies: string[], lang: string = 'hi-IN') {
    try {
      if (anomalies.length === 0) {
        return lang === 'te-IN' ? "మీ నివేదిక బాగుంది!" : "आपकी रिपोर्ट सामान्य है!";
      }

      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const languageName = lang === 'te-IN' ? "Telugu" : "Hindi";
      
      const prompt = `Explain these lab anomalies in a simple, friendly, one-sentence way for a patient. 
      IMPORTANT: Respond ONLY in ${languageName} (${lang}). 
      Anomalies: ${anomalies.join(', ')}.`;
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini failed:", error);
      
      // FIXED: Fallback now respects the requested language!
      if (lang === 'te-IN') {
        return "మీ ఫలితాల్లో కొన్ని అసాధారణతలు ఉన్నాయి. దయచేసి మీ వైద్యుడిని సంప్రదించండి.";
      }
      return "आपकी रिपोर्ट में कुछ विसंगतियां हैं। कृपया अपने डॉक्टर से परामर्श करें।";
    }
  }
}