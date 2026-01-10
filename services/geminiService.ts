
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
          text: `DEEP ED-TECH DATA EXTRACTION - TARGET: Delta Study / PhysicsWallah
          Source URL: ${url}
          HTML Content: 
          ${html.substring(0, 100000)}
          
          DIRECTIONS:
          1. Extract the Batch Name, Instructor, and Thumbnail.
          2. Delta Study often uses Next.js. Look for a large JSON string in script tags (id="__NEXT_DATA__").
          3. Within that JSON, extract:
             - Subjects (List of titles)
             - For each Subject, get all Lectures.
             - For each Lecture: Title, Video URL (usually .m3u8 or vimeo), Thumbnail, and Resources (PDFs/DPPs).
          
          JSON SCHEMA:
          {
            "title": "Batch Title",
            "instructor": "Name",
            "thumbnail": "High-res URL",
            "category": "JEE" | "NEET" | "Class 10th" | "Class 12th",
            "subjects": [
              {
                "title": "Subject Name",
                "lectures": [
                  { 
                    "title": "Lecture Title", 
                    "url": "Video Stream URL", 
                    "thumbnail": "Lecture Thumb URL",
                    "duration": "Time or 'LIVE'",
                    "resources": [
                      { "title": "Notes", "url": "PDF Link", "type": "pdf" },
                      { "title": "DPP", "url": "PDF Link", "type": "dpp" }
                    ]
                  }
                ]
              }
            ]
          }`
        }]
      }],
      config: {
        systemInstruction: "You are a specialized ed-tech crawler. Extract precise batch data. Return ONLY JSON.",
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Deep Extraction Error:", error);
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
