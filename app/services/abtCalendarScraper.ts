import { WebView } from 'react-native-webview';
import { parseABTEventsFromHTML, cacheABTHTML, ABTEvent } from './abtCalendarService';

let scraperWebView: WebView | null = null;
let scraperPromise: Promise<ABTEvent[]> | null = null;
let scraperResolve: ((events: ABTEvent[]) => void) | null = null;
let scraperReject: ((error: Error) => void) | null = null;

const SCRAPER_SCRIPT = `
  (function() {
    function extractContent() {
      const challengeText = document.getElementById('text');
      if (challengeText && challengeText.textContent.includes('Please wait')) {
        setTimeout(extractContent, 2000);
        return;
      }
      
      const bodyText = document.body.innerText || '';
      if (bodyText.length < 500) {
        setTimeout(extractContent, 2000);
        return;
      }
      
      const html = document.documentElement.outerHTML;
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'htmlContent',
          html: html
        }));
      }
    }
    
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

export async function scrapeABTCalendar(): Promise<ABTEvent[]> {
  if (scraperPromise) {
    return scraperPromise;
  }

  scraperPromise = new Promise<ABTEvent[]>((resolve, reject) => {
    scraperResolve = resolve;
    scraperReject = reject;

    setTimeout(() => {
      if (scraperReject) {
        scraperReject(new Error('Scraping timeout - no data received'));
        scraperPromise = null;
        scraperResolve = null;
        scraperReject = null;
      }
    }, 30000);
  });

  return scraperPromise;
}

export function handleScraperMessage(event: any) {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'htmlContent' && data.html) {
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

export function handleScraperError(error: any) {
  console.error('Scraper WebView error:', error);
  if (scraperReject) {
    scraperReject(new Error('Failed to load calendar page'));
    scraperPromise = null;
    scraperResolve = null;
    scraperReject = null;
  }
}

