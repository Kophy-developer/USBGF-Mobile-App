import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { parseABTEventsFromHTML, setInMemoryEvents, cacheEvents } from '../services/abtCalendarService';
import { theme } from '../theme/tokens';

export const ABTDataFetcher: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
          if (error) {
            setError(null);
          }
        }
      }
    } catch (error) {
      console.error('Error processing ABT Calendar data:', error);
    }
  };

  const handleError = useCallback(() => {
    console.error('ABT Calendar WebView error');
    setError('Unable to load calendar. Check your connection and try again.');
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setReloadKey((prev) => prev + 1);
    webViewRef.current?.reload();
  }, []);

  return (
    <>
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
          key={reloadKey}
          ref={webViewRef}
          source={{ uri: 'https://usbgf.org/abt-calendar/' }}
          style={{ 
            width: 1, 
            height: 1,
          }}
          injectedJavaScript={scraperScript}
          onMessage={handleMessage}
          onError={handleError}
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

      {error && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    backgroundColor: '#1B365D',
    borderRadius: theme.radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    flex: 1,
    color: theme.colors.surface,
    marginRight: theme.spacing.lg,
    ...theme.typography.body,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  retryText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '700',
  },
});

