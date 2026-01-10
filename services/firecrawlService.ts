
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
        formats: ['html'], // Changed to HTML to capture script tags and JSON data
        onlyMainContent: false, // We need the script tags for ed-tech sites
        waitFor: 3000,
        actions: [
          { type: 'wait', selector: 'body' },
          { type: 'scroll', direction: 'down', amount: 3000 }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Firecrawl Error: ${response.status}`);
    }

    const data = await response.json();
    const html = data.data.html;

    if (!html) throw new Error("Firecrawl returned empty document. The URL might be private or blocked.");

    // Use Gemini to structure the HTML data into our Portal Schema
    return await parseScrapedContent(html, url);
  } catch (error: any) {
    console.error("Firecrawl Scrape Failed:", error);
    throw error;
  }
};
