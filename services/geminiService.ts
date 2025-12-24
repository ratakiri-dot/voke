
import { GoogleGenAI } from "@google/genai";

// Always initialize with the direct process.env.API_KEY string
const apiKey = process.env.API_KEY || ''; // Safe fallback
const ai = new GoogleGenAI({ apiKey });

export const generateAITitle = async (content: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Buatkan judul singkat dan menarik (maksimal 5 kata) untuk tulisan berikut: "${content.substring(0, 500)}"`,
      config: { temperature: 0.7 }
    });
    // Extract text from the response using the .text property
    const generatedText = response.text || "Judul Otomatis";
    return generatedText.replace(/"/g, '').trim();
  } catch (error) {
    console.error("AI Error:", error);
    return "Judul Otomatis";
  }
};

export const generateAICaption = async (content: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Buatkan caption singkat untuk media sosial (maksimal 20 kata) berdasarkan tulisan ini: "${content.substring(0, 500)}"`,
      config: { temperature: 0.7 }
    });
    // Extract text from the response using the .text property
    const generatedText = response.text || "Terinspirasi untuk menulis hari ini.";
    return generatedText.trim();
  } catch (error) {
    console.error("AI Error:", error);
    return "Terinspirasi untuk menulis hari ini.";
  }
};
