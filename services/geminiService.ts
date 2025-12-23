import { GoogleGenAI } from "@google/genai";

// Fixed: Always use process.env.API_KEY directly as per guidelines.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const solveDoubt = async (question: string, context: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      // Using gemini-3-flash-preview for faster and more reliable responses for chat
      model: 'gemini-3-flash-preview',
      contents: `Context: You are a friendly, human-like tutor for Class 9 and 10 students. The student is watching a video titled "${context}".
      
      Question: ${question}`,
      config: {
        systemInstruction: "You are a friendly, relatable academic tutor. You speak in Hinglish (a natural mix of Hindi and English) like a cool Indian teacher. Keep explanations clear, engaging, and easy to understand. Use analogies from daily life in India. Do not sound robotic. For numericals, solve step-by-step. Use markdown for formulas.",
        temperature: 0.7,
      },
    });
    // Fixed: response.text is a getter property, not a method.
    return response.text || "I'm sorry, I couldn't process that. Please try again.";
  } catch (error) {
    console.error("AI Doubt Solver Error:", error);
    return "Error connecting to the AI teacher. Please check your internet connection.";
  }
};