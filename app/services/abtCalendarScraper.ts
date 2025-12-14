import { parseABTEventsFromHTML, ABTEvent } from './abtCalendarService';

let scraperPromise: Promise<ABTEvent[]> | null = null;
let scraperResolve: ((events: ABTEvent[]) => void) | null = null;
let scraperReject: ((error: Error) => void) | null = null;


const SCRAPER_SCRIPT = `
  (function() {
    let scrollAttempts = 0;
    const maxScrollAttempts = 20; // Maximum scroll attempts
    let lastHeight = 0;
    let stableCount = 0;
    const maxStableCount = 3; // Require 3 consecutive stable heights
    
    function scrollToBottom() {
      // Get current scroll position and document height
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const windowHeight = window.innerHeight;
      const remainingScroll = documentHeight - (currentScroll + windowHeight);
      
      // Check if we've reached the bottom (or very close)
      if (remainingScroll < 50) {
        // Height hasn't changed, we're at the bottom
        if (documentHeight === lastHeight) {
          stableCount++;
          if (stableCount >= maxStableCount) {
            // We've been at stable height for a while, extract content
            setTimeout(extractContent, 2000); // Wait 2 more seconds for any final loads
            return;
          }
        } else {
          // Height changed, reset stable count
          stableCount = 0;
          lastHeight = documentHeight;
        }
        
        // Wait a bit then check again
        setTimeout(() => {
          scrollToBottom();
        }, 1000);
        return;
      }
      
      // Reset stable count if we're still scrolling
      stableCount = 0;
      
      // Scroll down incrementally
      const scrollAmount = Math.min(remainingScroll, windowHeight * 0.8);
      window.scrollBy(0, scrollAmount);
      
      scrollAttempts++;
      
      // Wait for lazy loading, then continue scrolling
      setTimeout(() => {
        if (scrollAttempts >= maxScrollAttempts) {
          // Max attempts reached, extract what we have
        setTimeout(extractContent, 2000);
        return;
        }
        scrollToBottom();
      }, 1500); // Wait 1.5 seconds for lazy loading
      }
      
    function extractContent() {
      // Wait a final moment for any remaining async content
      setTimeout(() => {
      const html = document.documentElement.outerHTML;
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'htmlContent',
          html: html
        }));
      }
      }, 1000);
    }
    
    function startScraping() {
      // Check for loading indicators or challenges
      const challengeText = document.getElementById('text');
      if (challengeText && challengeText.textContent.includes('Please wait')) {
        setTimeout(startScraping, 2000);
        return;
      }
      
      // Initial body check
      const bodyText = document.body.innerText || '';
      if (bodyText.length < 500) {
        setTimeout(startScraping, 2000);
        return;
      }
      
      // Set initial height
      lastHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      
      // Start scrolling after initial load
      setTimeout(() => {
        scrollToBottom();
      }, 2000);
    }
    
    // Start the scraping process
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(startScraping, 3000);
      });
    } else {
      setTimeout(startScraping, 3000);
    }
    
    window.addEventListener('load', function() {
      setTimeout(startScraping, 3000);
    });
  })();
  true;
`;

export async function scrapeABTCalendar(): Promise<ABTEvent[]> {
  if (scraperPromise) {
    return scraperPromise;
  }

  scraperPromise = new Promise<ABTEvent[]>((resolve, reject) => {
    scraperResolve = resolve;
    scraperReject = reject;

    // Timeout after 60 seconds (lazy loading can take time)
    setTimeout(() => {
      if (scraperReject) {
        scraperReject(new Error('Scraping timeout - page took too long to load'));
        scraperPromise = null;
        scraperResolve = null;
        scraperReject = null;
      }
    }, 60000);
  });

  return scraperPromise;
}

export function handleScraperMessage(event: any) {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'htmlContent' && data.html) {
        const events = parseABTEventsFromHTML(data.html);
        if (scraperResolve) {
          scraperResolve(events);
          scraperPromise = null;
          scraperResolve = null;
          scraperReject = null;
        }
    }
  } catch (error) {
    console.error('Error processing scraper message:', error);
    if (scraperReject) {
      scraperReject(error as Error);
      scraperPromise = null;
      scraperResolve = null;
      scraperReject = null;
    }
  }
}

export function handleScraperError(error: any) {
  console.error('Scraper WebView error:', error);
  if (scraperReject) {
    scraperReject(new Error('Failed to load calendar page'));
    scraperPromise = null;
    scraperResolve = null;
    scraperReject = null;
  }
}

export function resetScraper() {
  scraperPromise = null;
  scraperResolve = null;
  scraperReject = null;
}
