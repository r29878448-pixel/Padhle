
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
          text: `DEEP CURRICULUM EXTRACTION - TARGET: PhysicsWallah / Delta / EdTech
          Source URL: ${url}
          HTML Context (Look for __NEXT_DATA__ or large JSON blobs): 
          ${html.substring(0, 150000)}
          
          TASK:
          1. Find the BATCH NAME, INSTRUCTOR, and MAIN BANNER (Look for high-res CDN links).
          2. Locate the "props" or "initialState" within the script tags.
          3. Reconstruct every SUBJECT.
          4. For every LECTURE, extract:
             - Precise Title (e.g., L-01: Units and Dimensions)
             - High-resolution THUMBNAIL URL
             - VIDEO URL (Look for .m3u8, vimeo, youtube, or s3 links)
             - DURATION (e.g., 01:45:22)
             - ATTACHMENTS (Look for 'notes', 'dpp', 'pdf' links)
          5. Category check: JEE, NEET, Class 9, 10, 11, or 12.`
        }]
      }],
      config: {
        systemInstruction: `You are a world-class EdTech data architect. 
        Your goal is to turn messy HTML into a perfect study portal database.
        
        CRITICAL: 
        - If you see multiple thumbnail sizes, choose the largest one.
        - Capture 'DPP' and 'Notes' separately in the resources array.
        
        JSON SCHEMA:
        {
          "title": "Batch Name",
          "category": "JEE" | "NEET" | "Class 10th" | "Class 12th",
          "instructor": "Name",
          "description": "Short bio",
          "thumbnail": "URL",
          "price": number,
          "subjects": [
            {
              "title": "Subject Name",
              "lectures": [
                { 
                  "title": "Title", 
                  "url": "Video Link", 
                  "thumbnail": "High-res Image URL",
                  "duration": "Duration or 'LIVE'",
                  "resources": [
                    { "title": "Class Notes", "url": "PDF URL", "type": "pdf" },
                    { "title": "DPP-01", "url": "PDF URL", "type": "dpp" }
                  ]
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
