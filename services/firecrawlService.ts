
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
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000,
        actions: [
          { type: 'wait', selector: 'div' },
          { type: 'scroll', direction: 'down', amount: 5000 }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Firecrawl Error: ${response.status}`);
    }

    const data = await response.json();
    const markdown = data.data.markdown;

    if (!markdown) throw new Error("Firecrawl returned empty document. The URL might be private or protected.");

    // Use Gemini to structure the markdown data into our Portal Schema
    return await parseScrapedContent(markdown, url);
  } catch (error: any) {
    console.error("Firecrawl Scrape Failed:", error);
    throw error;
  }
};
