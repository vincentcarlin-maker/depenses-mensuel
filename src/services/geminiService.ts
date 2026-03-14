import { GoogleGenAI, Type } from "@google/genai";

export async function parseReceiptImage(base64Image: string, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined. Please check your environment variables.");
    throw new Error("La clé API Gemini est manquante. Le scan ne peut pas fonctionner en dehors de l'environnement de développement sans configuration.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Extrais les articles achetés et leur prix depuis ce ticket de caisse. Ne renvoie que les articles achetés (ignore les sous-totaux, taxes, rendus de monnaie, etc. sauf si c'est une remise sur un article). Renvoie aussi le montant total payé. Le format doit être un objet JSON avec 'items' (tableau d'objets avec 'description' et 'amount') et 'total' (nombre).",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: "Nom de l'article" },
                  amount: { type: Type.NUMBER, description: "Prix de l'article" },
                },
                required: ["description", "amount"],
              },
            },
            total: { type: Type.NUMBER, description: "Montant total du ticket" },
          },
          required: ["items", "total"],
        },
      },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("No response from Gemini");
    
    return JSON.parse(jsonStr) as { items: { description: string, amount: number }[], total: number };
  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
}
