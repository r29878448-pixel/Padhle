
import { GoogleGenAI } from "@google/genai";
import { Course } from "../types";
import { TelegramPost } from "./db";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const classifyContent = async (post: TelegramPost, courses: Course[]) => {
  const ai = getAI();
  const batchList = courses.map(c => ({ id: c.id, title: c.title }));
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: `Match this educational content:
          Title: ${post.title}
          URL: ${post.url}
          
          Existing Batches: ${JSON.stringify(batchList)}`
        }]
      }],
      config: {
        systemInstruction: "Match content to courseId. Return JSON with courseId, subjectTitle, and chapterTitle.",
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return null;
  }
};

export const parseScrapedContent = async (html: string, url: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: `EDUCATIONAL CURRICULUM EXTRACTION (Delta Study / PW / Generic):
          Source URL: ${url}
          HTML Context: ${html.substring(0, 100000)}
          
          TASK:
          1. Detect the Class Level/Category (Class 9-12, JEE, NEET).
          2. Extract the Batch/Course Name and Instructor.
          3. Extract the high-resolution Main Banner/Thumbnail.
          4. Reconstruct the Curriculum Hierarchy:
             - Subject Headers
             - Lecture Titles
             - Video URLs or Video IDs (YouTube, M3U8, or Provider Links)
             - Durations
          5. Identify "LIVE" session markers.`
        }]
      }],
      config: {
        systemInstruction: `You are a curriculum extraction expert for high-end study portals. 
        Analyze the input and return a structured JSON.
        
        REQUIRED JSON SCHEMA:
        {
          "title": "Full Batch Name",
          "category": "Class 9th" | "Class 10th" | "Class 11th" | "Class 12th" | "JEE" | "NEET",
          "instructor": "Faculty Name",
          "description": "Short overview",
          "thumbnail": "High-res banner URL",
          "price": number,
          "subjects": [
            {
              "title": "Subject Name",
              "lectures": [
                { 
                  "title": "Lecture Title", 
                  "url": "Video URL", 
                  "thumbnail": "Lecture thumb",
                  "duration": "Duration or 'LIVE'",
                  "isLive": boolean 
                }
              ]
            }
          ]
        }`,
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Advanced Extraction Error:", error);
    return null;
  }
};

export const verifyUTR = async (utr: string): Promise<boolean> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Verify UTR: ${utr}` }] }],
    config: { systemInstruction: "Return 'VALID' for 12-digit transaction IDs." },
  });
  return response.text?.includes('VALID') || false;
};
