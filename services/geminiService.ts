
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
          text: `ED-TECH DATA EXTRACTION PROTOCOL: TARGET (deltastudy.site)
          Source URL: ${url}
          HTML Context: ${html.substring(0, 250000)}

          MISSION:
          Recover the COMPLETE curriculum for this batch. 
          The data is often hidden in a script tag with id="__NEXT_DATA__" or in props of a main component.

          EXTRACTION CHECKLIST:
          1. ROOT: Find Batch Title, Banner/Thumbnail URL, and Instructor.
          2. STRUCTURE: Identify all Subjects.
          3. HIERARCHY: Inside each Subject, locate the Lectures list.
          4. CONTENT: For EACH Lecture, extract:
             - Precise Title
             - Video Source Link (Search for .m3u8, .mp4, Vimeo links, or Youtube IDs)
             - Duration (e.g. "1h 30m" or "LIVE")
             - Lecture Thumbnail (if unique)
             - Resources: Find all associated PDF links for Notes and DPPs.

          STRICT JSON OUTPUT FORMAT:
          {
            "title": "String",
            "instructor": "String",
            "thumbnail": "String (URL)",
            "description": "String",
            "category": "JEE" | "NEET" | "Foundation" | "Class 10th",
            "subjects": [
              {
                "title": "Subject Name",
                "lectures": [
                  { 
                    "title": "Lecture Title", 
                    "url": "Video URL (HLS/MP4)", 
                    "thumbnail": "URL",
                    "duration": "String",
                    "resources": [
                      { "title": "Notes", "url": "PDF URL", "type": "pdf" },
                      { "title": "DPP", "url": "PDF URL", "type": "dpp" }
                    ]
                  }
                ]
              }
            ]
          }

          NOTE: If __NEXT_DATA__ is found, prioritize it. If not, scrape from the DOM elements (cards, lists). Ensure NO subjects or lectures are skipped.`
        }]
      }],
      config: {
        systemInstruction: "You are a professional ed-tech data scientist. You extract batch structures from complex HTML and JSON blobs with 100% accuracy for video links and resources.",
        responseMimeType: "application/json",
      },
    });
    
    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    if (parsed) {
      parsed.sourceUrl = url;
      console.log("[Gemini] Extracted Data Structure:", parsed);
    }
    return parsed;
  } catch (error) {
    console.error("Gemini Extraction Failure:", error);
    return null;
  }
};

export const verifyUTR = async (utr: string): Promise<boolean> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Verify Transaction ID: ${utr}` }] }],
    config: { systemInstruction: "Check if this looks like a valid 12-digit Indian banking UTR. Return 'VALID' or 'INVALID'." },
  });
  return response.text?.includes('VALID') || false;
};
