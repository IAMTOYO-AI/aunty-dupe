import { GoogleGenAI } from "@google/genai";

function getApiKey(): string {
  // Check process.env (for Node / Express / Vercel Serverless / Vite define replacement)
  if (typeof process !== "undefined" && process.env) {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
  }
  // Check import.meta.env (for Vite client-side deployment)
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
  if (metaEnv?.VITE_GEMINI_API_KEY) return metaEnv.VITE_GEMINI_API_KEY;
  if (metaEnv?.GEMINI_API_KEY) return metaEnv.GEMINI_API_KEY;
  return "";
}

export async function getHeartfeltReply(userInput: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], instruction: string) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("Gemini API key missing. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your Vercel Environment Variables.");
      return "I'm here for you, Aunty Modupe. Always wishing you the happiest of birthdays, Aunty! (Note: Please set your Gemini API key in Vercel settings to unlock full AI responses).";
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userInput }] }
      ],
      config: {
        systemInstruction: instruction,
        temperature: 0.8,
      }
    });

    return response.text || "Wishing you a wonderful birthday filled with warmth and joy, Aunty Dupe!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm here for you, Aunty Modupe. Always wishing you the happiest of birthdays, Aunty!";
  }
}

