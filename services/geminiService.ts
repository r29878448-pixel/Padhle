
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
          text: `PW ECOSYSTEM SCRAPE REQUEST (Classes 9, 10, 11, 12):
          Source URL: ${url}
          HTML Context: ${html.substring(0, 80000)}
          
          TASK:
          1. Detect the Class Level (Class 9th, 10th, 11th, or 12th).
          2. Extract the Batch Name, Instructor, and primary high-res Thumbnail.
          3. Look specifically for the JSON block in <script id="__NEXT_DATA__"> or similar props.
          4. Parse the curriculum tree:
             - Subjects (Physics, Chemistry, Maths, Biology, SST, etc.)
             - Chapters within each subject.
             - Lectures (Title, Video URL/ID, Duration, and Thumbnail).
          5. Identify "LIVE" sessions or "Scheduled" flags.
          6. If this is a redirect/onelink page, try to extract the target batch name from meta tags.`
        }]
      }],
      config: {
        systemInstruction: `You are a professional web scraper specialized in Physics Wallah content for K-12 and JEE/NEET. 
        Analyze the input and return a perfectly structured JSON.
        
        REQUIRED JSON SCHEMA:
        {
          "title": "Full Batch Name",
          "category": "Class 9th" | "Class 10th" | "Class 11th" | "Class 12th" | "JEE" | "NEET",
          "instructor": "Teacher Name or 'PW Team'",
          "description": "Short catchy description",
          "thumbnail": "High-res main image URL",
          "price": number,
          "subjects": [
            {
              "title": "Subject Name",
              "lectures": [
                { 
                  "title": "Lecture Title", 
                  "videoUrl": "Direct M3U8, YouTube or PW internal link", 
                  "thumbnail": "Lecture specific thumb",
                  "duration": "HH:MM:SS or 'LIVE'",
                  "type": "video" | "pdf" | "quiz",
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
    console.error("Advanced PW Parse Error:", error);
    return null;
  }
};

export const solveDoubt = async (question: string, context: string, botName: string = "AI Tutor") => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Context: ${context}\nQuestion: ${question}` }] }],
    config: { systemInstruction: `You are ${botName}, a friendly academic expert for students in Classes 9-12. Use a mix of Hindi and English (Hinglish).` },
  });
  return response.text;
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
