import React, { useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { parseABTEventsFromHTML, setInMemoryEvents, cacheEvents } from '../services/abtCalendarService';

/**
 * Hidden WebView component that fetches ABT Calendar data on app launch
 * This component should be mounted in the main app or navigation component
 */
export const ABTDataFetcher: React.FC = () => {
  const webViewRef = useRef<WebView>(null);

  // JavaScript to inject for scraping HTML
  const scraperScript = `
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

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'htmlContent' && data.html) {
        const parsedEvents = parseABTEventsFromHTML(data.html);
        if (parsedEvents.length > 0) {
          setInMemoryEvents(parsedEvents);
          cacheEvents(parsedEvents);
          console.log(`ABT Calendar: Fetched ${parsedEvents.length} events on app launch`);
        }
      }
    } catch (error) {
      console.error('Error processing ABT Calendar data:', error);
    }
  };

  return (
    <View 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        overflow: 'hidden',
        opacity: 0,
        zIndex: -9999,
        pointerEvents: 'none',
      }}
      pointerEvents="none"
    >
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://usbgf.org/abt-calendar/' }}
        style={{ 
          width: 1, 
          height: 1,
        }}
        injectedJavaScript={scraperScript}
        onMessage={handleMessage}
        onError={() => {
          console.error('ABT Calendar WebView error');
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        pointerEvents="none"
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled={false}
      />
    </View>
  );
};

