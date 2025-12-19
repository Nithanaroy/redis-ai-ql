
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { GenerationResult } from "../types";

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface RedisContext {
  keyPatterns: string;
  sampleData: string;
  indexInfo: string;
  otherMetadata: string;
}

export const generateRedisResponse = async (
  context: RedisContext,
  history: ChatMessage[], 
  userInput: string
): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const fullContext = `
    REDIS DATABASE CONTEXT:
    
    1. KEY PATTERNS:
    ${context.keyPatterns}

    2. SAMPLE DATA:
    ${context.sampleData}

    3. INDEX INFO:
    ${context.indexInfo}

    4. OTHER METADATA:
    ${context.otherMetadata}
  `;
  
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: history.length === 0 ? fullContext + "\n\nQUERY: " + userInput : userInput }] }
  ] as any;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              description: "The Redis command(s) generated.",
            },
            explanation: {
              type: Type.STRING,
              description: "Brief explanation of the command or the fix.",
            },
          },
          required: ["command", "explanation"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Error generating Redis response:", error);
    throw new Error("Failed to generate response. Please check your context fields.");
  }
};
