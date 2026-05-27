import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class InsightService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  async getFriendlySummary(anomalies: string[]) {
    try {
      if (anomalies.length === 0) return "Your report looks great!";

      // We explicitly use the stable v1 API version by modifying the model 
      // initialization if your SDK supports it, or simply use the model name
      // that is mapped to the stable API.
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Explain these lab anomalies in a simple, friendly, one-sentence way for a patient: ${anomalies.join(', ')}. Keep it encouraging but advise them to consult a doctor.`;
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini failed. Switching to Rule-Based fallback.");
      return "Your results show some anomalies. Please consult your physician for a detailed interpretation.";
    }
  }
}