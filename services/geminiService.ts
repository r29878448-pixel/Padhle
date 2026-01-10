
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseScrapedContent = async (html: string, url: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: `ED-TECH CRAWLER: DELTA STUDY ARCHITECTURE
          Target URL: ${url}
          HTML Content: ${html.substring(0, 200000)}

          CRITICAL EXTRACTION STEPS:
          1. Locate <script id="__NEXT_DATA__" type="application/json">. This contains the 'props.pageProps' object with the full batch data.
          2. From 'pageProps', extract:
             - Batch Name (title)
             - Batch Thumbnail (banner/image)
             - Teacher Name
             - All Subjects (subjects array)
             - Inside each Subject, find 'lectures' or 'content'.
             - For each Lecture: 'topic', 'videoUrl' (or 'videoResource'), 'thumbnail', and 'attachments' (PDFs for Notes/DPP).
          3. Format the result into the standard Portal JSON below.
          4. If __NEXT_DATA__ is missing, fallback to parsing the visible DOM for class names like 'lecture-card', 'subject-list', etc.

          JSON SCHEMA:
          {
            "title": "Full Batch Name",
            "instructor": "Teacher Name",
            "thumbnail": "High-Res Image URL",
            "category": "JEE" | "NEET" | "Foundation" | "Class 10th",
            "subjects": [
              {
                "title": "Subject Title (e.g. Physics)",
                "lectures": [
                  { 
                    "title": "Lecture Name (e.g. L-01 Electrostatics)", 
                    "url": "Direct Video Link or HLS .m3u8", 
                    "thumbnail": "Lecture-specific Thumbnail",
                    "duration": "LIVE" | "Recording",
                    "resources": [
                      { "title": "Lecture Notes", "url": "PDF URL", "type": "pdf" },
                      { "title": "DPP Sheet", "url": "PDF URL", "type": "dpp" }
                    ]
                  }
                ]
              }
            ]
          }`
        }]
      }],
      config: {
        systemInstruction: "You are an expert at reverse-engineering Ed-Tech JSON states from HTML. Extract precise video and PDF links.",
        responseMimeType: "application/json",
      },
    });
    
    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    if (parsed) parsed.sourceUrl = url;
    return parsed;
  } catch (error) {
    console.error("Gemini Deep Extraction Failed:", error);
    return null;
  }
};

export const verifyUTR = async (utr: string): Promise<boolean> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Verify UTR: ${utr}` }] }],
    config: { systemInstruction: "Return 'VALID' if the UTR matches a 12-digit transaction format." },
  });
  return response.text?.includes('VALID') || false;
};
