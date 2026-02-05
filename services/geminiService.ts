
import { GoogleGenAI, Type } from "@google/genai";
import { DemoSite } from "../types.ts";

export const getSmartSearchResults = async (query: string, availableSites: DemoSite[]): Promise<string[]> => {
  if (!query.trim()) return availableSites.map(s => s.id);

  // Directly obtain the API key from the environment variable as per guidelines
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API_KEY não encontrada. Usando filtro local.");
    const lowerQuery = query.toLowerCase();
    return availableSites
      .filter(s => 
        s.title.toLowerCase().includes(lowerQuery) || 
        s.description.toLowerCase().includes(lowerQuery)
      )
      .map(s => s.id);
  }

  try {
    // Correct initialization of GoogleGenAI using a named parameter
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const siteListContext = availableSites.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User search query: "${query}". 
      Available items: ${JSON.stringify(siteListContext)}.
      Analyze the user query. Typos might happen. Return a JSON array of IDs that match.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    // Access the .text property directly from the response object
    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Erro na busca IA:", error);
    const lowerQuery = query.toLowerCase();
    return availableSites
      .filter(s => s.title.toLowerCase().includes(lowerQuery))
      .map(s => s.id);
  }
};
