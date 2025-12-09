import { GoogleGenAI } from "@google/genai";

// Lazy initialization to prevent crashes if API key is missing or invalid at startup
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || '';
    if (apiKey) {
      try {
        ai = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI", e);
      }
    }
  }
  return ai;
};

export const generateProductDescription = async (productName: string, category: string): Promise<{ description: string, bullets: string[] }> => {
  const aiInstance = getAI();

  if (!aiInstance) {
    console.warn("GoogleGenAI not initialized (missing API_KEY). Returning mock description.");
    return {
      description: `[MOCK AI] Descrição gerada automaticamente para ${productName}. Este é um produto da categoria ${category}. Excelente qualidade e eficácia comprovada.`,
      bullets: ["Indicação 1: Uso diário", "Indicação 2: Conservar em local fresco", "Indicação 3: Consulte um especialista"]
    };
  }

  try {
    const prompt = `
      Você é um especialista em farmácia. Crie uma descrição comercial, curta e profissional para um produto de farmácia.
      Produto: ${productName}
      Categoria: ${category}
      
      Retorne APENAS um JSON com o seguinte formato, sem markdown code blocks:
      {
        "description": "Texto corrido com cerca de 30-50 palavras.",
        "bullets": ["Bullet 1 (benefício ou indicação)", "Bullet 2", "Bullet 3"]
      }
    `;

    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.0-flash', // Updated to latest flash model if available, or fallback
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      description: "Erro ao gerar descrição com IA. Por favor, escreva manualmente.",
      bullets: []
    };
  }
};
