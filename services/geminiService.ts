import { GoogleGenAI } from "@google/genai";
import { Agent } from "../types";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const genAI = new GoogleGenAI({ apiKey: API_KEY });

export async function generateSpeech(text: string, voice: string): Promise<ArrayBuffer> {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: text,
      config: {
        responseModalities: ["AUDIO"],
      },
    });

    // Handle audio response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes.buffer;
        }
      }
    }
    
    throw new Error("No audio data received from Gemini");
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
}

export async function chatWithAgent(
  message: string, 
  agent: Agent, 
  history: { role: string; content: string }[] = []
): Promise<string> {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const model = genAI.models.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `System: ${agent.systemPrompt}` }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will follow these instructions." }],
        },
        ...history.map((h) => ({
          role: h.role === "user" ? "user" : "model" as const,
          parts: [{ text: h.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chat:", error);
    throw error;
  }
}

export async function* streamChatWithAgent(
  message: string,
  agent: Agent,
  history: { role: string; content: string }[] = []
): AsyncGenerator<string, void, unknown> {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const model = genAI.models.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `System: ${agent.systemPrompt}` }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will follow these instructions." }],
        },
        ...history.map((h) => ({
          role: h.role === "user" ? "user" : "model" as const,
          parts: [{ text: h.content }],
        })),
      ],
    });

    const result = await chat.sendMessageStream(message);
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Error in streaming chat:", error);
    throw error;
  }
}
