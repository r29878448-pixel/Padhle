
import { GoogleGenAI, Type } from "@google/genai";
import { Course } from "../types";
import { TelegramPost } from "./db";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Added missing classifyContent export used by automation.ts
export const classifyContent = async (post: TelegramPost, courses: Course[]) => {
  const ai = getAI();
  const batchList = courses.map(c => ({ id: c.id, title: c.title }));
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: `Match this educational content to one of our existing batches:
          Content Title: ${post.title}
          Source URL: ${post.url}
          
          Existing Batches: ${JSON.stringify(batchList)}`
        }]
      }],
      config: {
        systemInstruction: "You are an expert academic content organizer. Match the content to the most appropriate courseId from the list. If no clear match exists, pick the most relevant one or suggest a general one. Also provide a subjectTitle (e.g. Physics) and a chapterTitle. Return valid JSON only.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseId: { type: Type.STRING, description: "The ID of the matched course" },
            subjectTitle: { type: Type.STRING, description: "Suggested subject name" },
            chapterTitle: { type: Type.STRING, description: "Suggested chapter name" }
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

export const solveDoubt = async (question: string, context: string, botName: string = "AI Tutor") => {
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
        systemInstruction: `You are '${botName}', a friendly academic tutor. You speak in a natural mix of Hindi and English (Hinglish). Never mention Gemini or Google. Always refer to yourself as ${botName}.`,
        temperature: 0.7,
      },
    });
    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("AI Error:", error);
    return "The AI teacher is offline. Please try again later.";
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
          text: `DEEP AUTO-FETCH REQUEST:
          Source URL: ${url}
          HTML Content: ${html.substring(0, 60000)}
          
          TASK:
          1. Extract Main Batch Title, Instructor, and primary Thumbnail.
          2. Crucial: Extract every lecture/module thumbnail individually.
          3. Crucial: Identify if a lecture is 'LIVE' based on text indicators like 'Live now', 'Scheduled', or specific CSS classes.
          4. Extract direct video links (M3U8, HLS, or YouTube) and document PDFs.`
        }]
      }],
      config: {
        systemInstruction: `You are a high-performance educational content crawler. 
        Your goal is to parse HTML and return a detailed JSON batch structure.
        
        REQUIRED JSON STRUCTURE:
        {
          "title": "Batch Name",
          "description": "Catchy description",
          "instructor": "Teacher Name",
          "price": number,
          "thumbnail": "Main Batch Poster URL",
          "subjects": [
            {
              "title": "Subject Name",
              "lectures": [
                { 
                  "title": "Lecture Title", 
                  "videoUrl": "Direct Stream or YT URL", 
                  "thumbnail": "Lecture-specific thumbnail URL if found",
                  "duration": "HH:MM:SS",
                  "isLive": boolean 
                }
              ]
            }
          ]
        }
        
        Rules:
        - If individual lecture thumbnails aren't obvious, look for video placeholder images.
        - Set 'isLive' to true if the content is currently streaming or scheduled.
        - Output valid JSON only.`,
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Scrape Parsing Error:", error);
    return null;
  }
};

export const verifyUTR = async (utr: string): Promise<boolean> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{ text: `Verify UTR: "${utr}"` }]
      }],
      config: {
        systemInstruction: "If the input looks like a 12-digit Indian Transaction ID, return 'VALID', else 'INVALID'.",
        responseMimeType: "text/plain",
      },
    });
    return response.text?.trim().toUpperCase() === 'VALID';
  } catch (error) {
    return false;
  }
};
