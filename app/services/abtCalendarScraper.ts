import { WebView } from 'react-native-webview';
import { parseABTEventsFromHTML, cacheABTHTML, ABTEvent } from './abtCalendarService';

/**
 * Scraper service that uses WebView to fetch ABT Calendar data
 * This handles Cloudflare protection by running JavaScript in WebView
 */

let scraperWebView: WebView | null = null;
let scraperPromise: Promise<ABTEvent[]> | null = null;
let scraperResolve: ((events: ABTEvent[]) => void) | null = null;
let scraperReject: ((error: Error) => void) | null = null;

/**
 * JavaScript to inject into WebView for extracting HTML
 */
const SCRAPER_SCRIPT = `
  (function() {
    function extractContent() {
      // Check if we're past the Cloudflare challenge
      const challengeText = document.getElementById('text');
      if (challengeText && challengeText.textContent.includes('Please wait')) {
        setTimeout(extractContent, 2000);
        return;
      }
      
      // Check if page has actual content
      const bodyText = document.body.innerText || '';
      if (bodyText.length < 500) {
        setTimeout(extractContent, 2000);
        return;
      }
      
      // Extract the HTML content
      const html = document.documentElement.outerHTML;
      
      // Send HTML back to React Native
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'htmlContent',
          html: html
        }));
      }
    }
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(extractContent, 3000);
      });
    } else {
      setTimeout(extractContent, 3000);
    }
    
    window.addEventListener('load', function() {
      setTimeout(extractContent, 3000);
    });
  })();
  true;
`;

/**
 * Create a WebView scraper component (hidden)
 */
export const createScraperWebView = (
  onMessage: (event: any) => void,
  onError: (error: any) => void
) => {
  return (
    <WebView
      source={{ uri: 'https://usbgf.org/abt-calendar/' }}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
      injectedJavaScript={SCRAPER_SCRIPT}
      onMessage={onMessage}
      onError={onError}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
    />
  );
};

/**
 * Scrape ABT Calendar data using WebView
 * Returns a promise that resolves with events
 */
export async function scrapeABTCalendar(): Promise<ABTEvent[]> {
  // If already scraping, return existing promise
  if (scraperPromise) {
    return scraperPromise;
  }

  scraperPromise = new Promise<ABTEvent[]>((resolve, reject) => {
    scraperResolve = resolve;
    scraperReject = reject;

    // This will be handled by the WebView component
    // The promise will be resolved when HTML is received
    setTimeout(() => {
      if (scraperReject) {
        scraperReject(new Error('Scraping timeout - no data received'));
        scraperPromise = null;
        scraperResolve = null;
        scraperReject = null;
      }
    }, 30000); // 30 second timeout
  });

  return scraperPromise;
}

/**
 * Handle message from WebView scraper
 */
export function handleScraperMessage(event: any) {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'htmlContent' && data.html) {
      // Parse and cache the HTML
      cacheABTHTML(data.html, true).then(() => {
        const events = parseABTEventsFromHTML(data.html);
        if (scraperResolve) {
          scraperResolve(events);
          scraperPromise = null;
          scraperResolve = null;
          scraperReject = null;
        }
      });
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

/**
 * Handle error from WebView scraper
 */
export function handleScraperError(error: any) {
  console.error('Scraper WebView error:', error);
  if (scraperReject) {
    scraperReject(new Error('Failed to load calendar page'));
    scraperPromise = null;
    scraperResolve = null;
    scraperReject = null;
  }
}

