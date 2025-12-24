
import { GoogleGenAI, Type } from "@google/genai";
import { Course } from "../types";
import { TelegramPost } from "./db";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const solveDoubt = async (question: string, context: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
      contents: `NEW CONTENT ARRIVED:
      Title: "${post.title}"
      Type: "${post.type}"
      
      EXISTING STRUCTURE: ${JSON.stringify(courseSchema)}`,
      config: {
        systemInstruction: `You are the Lead Academic Coordinator for Study Portal.
        Your goal is to organize Telegram posts into the correct Batches and Subjects.
        
        RULES:
        1. Match the "Title" to the best "Course" and "Subject".
        2. If the Subject doesn't exist but is clearly mentioned (e.g. "Biology Lecture"), suggest a NEW subject name.
        3. Extract a clean Chapter Name (e.g. from "Ch-5 Optics Notes", extract "Optics").
        4. High confidence is required for matching. If unsure, match to the most popular/relevant batch.
        
        Return ONLY valid JSON matching the schema provided.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseId: { type: Type.STRING, description: "ID of the best matched course" },
            subjectTitle: { type: Type.STRING, description: "Title of the subject (Exact match or new name)" },
            chapterTitle: { type: Type.STRING, description: "Clean name of the chapter" },
            confidence: { type: Type.NUMBER }
          },
          required: ["courseId", "subjectTitle", "chapterTitle"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Classification Error:", error);
    return null;
  }
};
