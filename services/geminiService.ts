
import { GoogleGenAI, Type } from "@google/genai";
import { Course } from "../types";
import { TelegramPost } from "./db";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const solveDoubt = async (question: string, context: string) => {
  const ai = getAI();
  try {
    // Fix: Use gemini-3-pro-preview for complex reasoning and academic tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Context: You are a friendly, human-like tutor for Class 9 and 10 students. The student is watching a video titled "${context}".
      
      Question: ${question}`,
      config: {
        systemInstruction: "You are a friendly, relatable academic tutor. You speak in Hinglish (a natural mix of Hindi and English) like a cool Indian teacher. Keep explanations clear, engaging, and easy to understand. Use analogies from daily life in India. Do not sound robotic. For numericals, solve step-by-step. Use markdown for formulas.",
        temperature: 0.7,
      },
    });
    return response.text || "I'm sorry, I couldn't process that. Please try again.";
  } catch (error) {
    console.error("AI Doubt Solver Error:", error);
    return "Error connecting to the AI teacher.";
  }
};

export const verifyUTR = async (utr: string): Promise<boolean> => {
  const ai = getAI();
  try {
    // Fix: Standard flash model is sufficient for basic verification tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Verify if this looks like a valid Indian Banking UTR (Unified Transaction Reference) or UPI Transaction ID: "${utr}"`,
      config: {
        systemInstruction: "You are a payment verification assistant. Analyze the string. Indian UTRs are usually 12 digits. UPI IDs vary but have a specific pattern. If it looks like a real transaction ID, return exactly 'VALID'. If it's clearly fake, gibberish, or too short, return 'INVALID'.",
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
    // Fix: Use gemini-3-pro-preview for complex classification logic
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `NEW INCOMING POST:
      Title: "${post.title}"
      Type: "${post.type}"
      
      PORTAL STRUCTURE: ${JSON.stringify(courseSchema)}`,
      config: {
        systemInstruction: `You are the Lead Academic Organizer for Study Portal.
        Assign this content to the correct Batch, Subject, and Chapter.
        
        LOGIC RULES:
        1. Batch Matching: Identify if it's for Class 9, 10, JEE, NEET, etc.
        2. Subject Identification: Look for Physics, Chemistry, Maths, etc.
        3. Chapter Extraction: Clean the title to get the Chapter name (e.g., from "L-02 | Atoms and Molecules", Chapter is "Atoms and Molecules").
        4. No Fail: If Subject or Chapter is missing in the structure, provide the logical name so it can be created.
        
        Output ONLY a JSON object. No backticks.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseId: { type: Type.STRING, description: "Matched Course ID" },
            subjectTitle: { type: Type.STRING, description: "Logical Subject Name" },
            chapterTitle: { type: Type.STRING, description: "Logical Chapter Name" },
            confidence: { type: Type.NUMBER }
          },
          required: ["courseId", "subjectTitle", "chapterTitle"]
        }
      }
    });

    // Fix: Simplified extraction using response.text property directly as per SDK guidelines
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Classification Error:", error);
    return null;
  }
};
