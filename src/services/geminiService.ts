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
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyse cette image de ticket de caisse avec une précision extrême.
            
            Objectifs :
            1. Identifier le nom de l'enseigne (magasin).
            2. Identifier la date et l'heure de l'achat.
            3. Extraire la liste exhaustive des articles achetés.
            4. Identifier le montant total final payé.

            Règles de filtrage strictes :
            - ARTICLES : Ne garde que les produits réels. Ignore les lignes de taxes (TVA), les sous-totaux, les informations de paiement, ou les messages promotionnels.
            - REMISES : Ignore impérativement les bons de réduction globaux, les remises fidélité différées, ou les bons d'achat. Si un article a une remise immédiate (ex: -30% sur le produit), utilise le prix final après remise pour cet article.
            - NETTOYAGE : Nettoie les noms d'articles des abréviations cryptiques (ex: 'LARD.FUM.X3' -> 'Lardons fumés x3') pour les rendre lisibles.
            - TOTAL : Le 'total' doit être le montant net à payer (après toutes les remises immédiates).

            Format de sortie : JSON pur respectant le schéma fourni.`,
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
                  description: { type: Type.STRING, description: "Nom lisible de l'article" },
                  amount: { type: Type.NUMBER, description: "Prix unitaire final de l'article" },
                },
                required: ["description", "amount"],
              },
            },
            total: { type: Type.NUMBER, description: "Montant total net payé" },
            store: { type: Type.STRING, description: "Nom de l'enseigne/magasin" },
            date: { type: Type.STRING, description: "Date au format ISO 8601 (YYYY-MM-DDTHH:mm:ss)" },
          },
          required: ["items", "total"],
        },
      },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("No response from Gemini");
    
    return JSON.parse(jsonStr) as { 
      items: { description: string, amount: number }[], 
      total: number,
      store?: string,
      date?: string
    };
  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
}
