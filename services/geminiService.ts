
import { GoogleGenAI, Type } from "@google/genai";
import { Course } from "../types";
import { TelegramPost } from "./db";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const solveDoubt = async (question: string, context: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: `Context: You are a friendly, human-like tutor for students. The student is watching a lecture module titled "${context}".
      
      Question: ${question}`
        }]
      }],
      config: {
        systemInstruction: "You are 'PW Teacher', a friendly academic tutor. You speak in a natural mix of Hindi and English (Hinglish) like an expert Indian faculty member. Keep explanations very simple, clear, and encouraging. Use daily life analogies. For math/physics problems, show steps clearly. Use Markdown for formatting and math symbols.",
        temperature: 0.7,
      },
    });
    return response.text || "I'm sorry, I couldn't process that. Please try again.";
  } catch (error) {
    console.error("AI Doubt Solver Error:", error);
    return "The AI teacher is currently unavailable. Please try again in a moment.";
  }
};

export const verifyUTR = async (utr: string): Promise<boolean> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{ text: `Verify if this looks like a valid Indian Banking UTR or UPI Transaction ID: "${utr}"` }]
      }],
      config: {
        systemInstruction: "Analyze the input. Indian UTRs/Transaction IDs are usually 12 digits. If it looks like a legitimate reference ID, return exactly 'VALID'. If it's fake, gibberish, or too short, return 'INVALID'.",
        responseMimeType: "text/plain",
      },
    });
    return response.text?.trim().toUpperCase() === 'VALID';
  } catch (error) {
    console.error("AI UTR Verification Error:", error);
    return false;
  }
};

export const classifyContent = async (post: TelegramPost, courses: Course[]) => {
  const ai = getAI();
  
  const courseSchema = courses.map(c => ({
    id: c.id,
    title: c.title,
    subjects: c.subjects.map(s => ({ id: s.id, title: s.title }))
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: `NEW INCOMING POST:
      Title: "${post.title}"
      Type: "${post.type}"
      
      PORTAL STRUCTURE: ${JSON.stringify(courseSchema)}`
        }]
      }],
      config: {
        systemInstruction: `You are the Lead Academic Organizer.
        Assign this content to the correct Batch, Subject, and Chapter based on the portal structure.
        
        LOGIC:
        1. Identify the Batch (JEE, NEET, Class 10, etc).
        2. Identify the Subject (Physics, Chemistry, etc).
        3. Extract the Chapter name from the title.
        
        Output ONLY a JSON object.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseId: { type: Type.STRING },
            subjectTitle: { type: Type.STRING },
            chapterTitle: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["courseId", "subjectTitle", "chapterTitle"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Classification Error:", error);
    return null;
  }
};
