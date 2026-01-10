
import { parseScrapedContent } from './geminiService';

const FIRECRAWL_API_KEY = 'fc-354566035d2943509656acc3df1e8a3d';
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1/scrape';

export const scrapeDeltaContent = async (url: string) => {
  try {
    const response = await fetch(FIRECRAWL_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: url,
        formats: ['html'],
        onlyMainContent: false,
        waitFor: 5000, // Increased wait for heavy ed-tech pages
        actions: [
          { type: 'wait', selector: 'body' },
          { type: 'scroll', direction: 'down', amount: 5000 }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Firecrawl Access Denied: ${response.status}`);
    }

    const data = await response.json();
    const html = data.data.html;

    if (!html || html.length < 1000) throw new Error("Firecrawl returned insufficient data. The URL might be protected or private.");

    // Use Gemini to structure the HTML data into our Portal Schema
    return await parseScrapedContent(html, url);
  } catch (error: any) {
    console.error("Firecrawl Scrape Failed:", error);
    throw error;
  }
};
