import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ABTEvent {
  id: string;
  dateRange: string; // e.g., "18 - 24 Nov"
  title: string; // Event name
  location: string; // Event location/venue
  month: string; // Full month name (e.g., "November")
  year: string; // Year (e.g., "2025")
}

const ABT_CALENDAR_URL = 'https://usbgf.org/abt-calendar/';
const CACHE_KEY = 'abt_calendar_events';
const CACHE_TIMESTAMP_KEY = 'abt_calendar_timestamp';

// In-memory cache (cleared on app close)
let inMemoryEvents: ABTEvent[] | null = null;
let isFetching = false;

/**
 * Seed data - manually extracted events as fallback
 * This ensures the app always has data to display
 */
const SEED_EVENTS: ABTEvent[] = [
  {
    id: 'event-1-nov-2025',
    dateRange: '18 - 24 Nov',
    title: '2025 Miami Open Backgammon Championship (ABT)',
    location: 'Tuesday, Newport Beachside Hotel & Resort',
    month: 'November',
    year: '2025',
  },
  {
    id: 'event-2-dec-2025',
    dateRange: '04 - 07 Dec',
    title: '2025 California State Championships (ABT)',
    location: 'Thursday, Hilton Los Angeles Airport',
    month: 'December',
    year: '2025',
  },
  {
    id: 'event-3-jan-2026',
    dateRange: '15 - 19 Jan',
    title: '2026 New York Metropolitan Open',
    location: 'Thursday, Hyatt Regency on the Hudson',
    month: 'January',
    year: '2026',
  },
  {
    id: 'event-4-feb-2026',
    dateRange: '04 - 08 Feb',
    title: '2026 Texas Backgammon Championships',
    location: 'Wednesday, Gunter Hotel',
    month: 'February',
    year: '2026',
  },
  {
    id: 'event-5-feb-2026-2',
    dateRange: '26 Feb - 01 Mar',
    title: '2026 Atlanta Classic',
    location: 'Thursday, Kimpton Overland Hotel - Atlanta Airport',
    month: 'February',
    year: '2026',
  },
  {
    id: 'event-6-mar-2026',
    dateRange: '26 - 29 Mar',
    title: '2026 Ohio State Championships',
    location: 'Thursday, Holiday Inn Canton (Belden Village) by IHG',
    month: 'March',
    year: '2026',
  },
  {
    id: 'event-7-apr-2026',
    dateRange: '15 - 19 Apr',
    title: '2026 Cherry Blossom Championship (ABT)',
    location: 'Wednesday, Hyatt Regency at Dulles Airport',
    month: 'April',
    year: '2026',
  },
  {
    id: 'event-8-apr-2026-2',
    dateRange: '30 Apr - 03 May',
    title: '2026 Charlotte Backgammon Invitational',
    location: 'Thursday, Hilton Charlotte University Place',
    month: 'April',
    year: '2026',
  },
  {
    id: 'event-9-may-2026',
    dateRange: '20 - 25 May',
    title: '2026 Chicago Open',
    location: 'Wednesday, Embassy Suites O\'Hare Rosemont',
    month: 'May',
    year: '2026',
  },
  {
    id: 'event-10-jun-2026',
    dateRange: '17 - 21 Jun',
    title: '2026 St. Louis Gateway Open',
    location: 'Wednesday, Holiday Inn St. Louis Airport West-Earth City',
    month: 'June',
    year: '2026',
  },
  {
    id: 'event-11-jul-2026',
    dateRange: '01 - 05 Jul',
    title: '2026 Michigan Summer Championships',
    location: 'Wednesday, Sheraton Detroit Novi Hotel',
    month: 'July',
    year: '2026',
  },
  {
    id: 'event-12-aug-2026',
    dateRange: '05 - 09 Aug',
    title: '2026 Wisconsin State Backgammon Championships',
    location: 'Wednesday, Best Western Plus InnTowner Madison',
    month: 'August',
    year: '2026',
  },
];

/**
 * Parse HTML content to extract ABT events
 * Based on the exact structure from https://usbgf.org/abt-calendar/
 */
export function parseABTEventsFromHTML(html: string): ABTEvent[] {
  const events: ABTEvent[] = [];
  
  try {
    // Remove script and style tags
    const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Pattern to match month/year headers like "November 2025"
    const monthYearPattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi;
    
    // Pattern to match date ranges like "18 - 24 Nov" or "04 - 07 Dec" or "26 Feb - 01 Mar"
    const dateRangePattern = /(\d{1,2}\s*[-–—]\s*\d{1,2}\s+[A-Z]{3}|\d{1,2}\s+[A-Z]{3})/gi;
    
    // Find all month/year sections
    const monthSections: Array<{ month: string; year: string; index: number }> = [];
    let match;
    
    while ((match = monthYearPattern.exec(cleanHtml)) !== null) {
      monthSections.push({
        month: match[1],
        year: match[2],
        index: match.index,
      });
    }
    
    // For each month section, find events
    monthSections.forEach((monthSection, monthIndex) => {
      const startIndex = monthSection.index;
      const endIndex = monthIndex < monthSections.length - 1 
        ? monthSections[monthIndex + 1].index 
        : cleanHtml.length;
      
      const sectionHtml = cleanHtml.substring(startIndex, endIndex);
      
      // Find date ranges in this section
      const dateMatches: Array<{ dateRange: string; index: number }> = [];
      let dateMatch;
      const localDatePattern = new RegExp(dateRangePattern.source, 'gi');
      
      while ((dateMatch = localDatePattern.exec(sectionHtml)) !== null) {
        dateMatches.push({
          dateRange: dateMatch[1].trim(),
          index: dateMatch.index,
        });
      }
      
      // For each date range, find the event title and location
      dateMatches.forEach((dateMatch) => {
        const afterDate = sectionHtml.substring(
          dateMatch.index + dateMatch.dateRange.length,
          dateMatch.index + dateMatch.dateRange.length + 500
        );
        
        // Look for event title (usually after #### or in h4/h3 tags)
        const titlePatterns = [
          /####\s*([^<]+?)(?:<|EVENT DETAIL|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Monday)/i,
          /<h[34][^>]*>([^<]+?)<\/h[34]>/i,
          />\s*([A-Z][^<]{15,120}?)(?:<|EVENT DETAIL|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Monday)/i,
        ];
        
        let title = '';
        for (const pattern of titlePatterns) {
          const titleMatch = afterDate.match(pattern);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim()
              .replace(/\s+/g, ' ')
              .replace(/[<>####]/g, '')
              .trim();
            if (title.length > 10) break;
          }
        }
        
        // Look for location (usually after day of week)
        const locationPattern = /(?:Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Monday)[,\s]+([^<]{10,80}?)(?:,|$|\.|<|EVENT)/i;
        const locationMatch = afterDate.match(locationPattern);
        const location = locationMatch ? locationMatch[1].trim() : '';
        
        // Only add if we have valid data
        if (title && title.length > 10 && location && location.length > 5) {
          // Skip if it's just "EVENT DETAIL" or similar
          if (!title.toUpperCase().includes('EVENT DETAIL') && 
              !title.toUpperCase().includes('DETAIL') &&
              title.length > 15) {
            events.push({
              id: `event-${events.length}-${monthSection.month}-${monthSection.year}`,
              dateRange: dateMatch.dateRange,
              title,
              location,
              month: monthSection.month,
              year: monthSection.year,
            });
          }
        }
      });
    });
    
    // Sort events chronologically
    events.sort((a, b) => {
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const yearDiff = parseInt(a.year) - parseInt(b.year);
      if (yearDiff !== 0) return yearDiff;
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
    
    return events;
  } catch (error) {
    console.error('Error parsing ABT events:', error);
    return [];
  }
}

/**
 * Fetch ABT Calendar events using direct HTTP fetch with enhanced headers
 * Attempts to bypass Cloudflare protection
 */
export async function fetchABTEventsDirect(): Promise<ABTEvent[]> {
  if (isFetching) {
    return [];
  }
  
  isFetching = true;
  try {
    const response = await fetch(ABT_CALENDAR_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const events = parseABTEventsFromHTML(html);
    
    if (events.length > 0) {
      setInMemoryEvents(events);
      await cacheEvents(events);
      return events;
    }
    
    // If parsing fails, return seed data
    return SEED_EVENTS;
  } catch (error) {
    console.error('Direct fetch failed:', error);
    // Return seed data as fallback
    return SEED_EVENTS;
  } finally {
    isFetching = false;
  }
}

/**
 * Store events in memory (cleared on app close)
 */
export function setInMemoryEvents(events: ABTEvent[]): void {
  inMemoryEvents = events;
}

/**
 * Get events from memory cache
 */
export function getInMemoryEvents(): ABTEvent[] | null {
  return inMemoryEvents;
}

/**
 * Clear memory cache (called on app close)
 */
export function clearInMemoryCache(): void {
  inMemoryEvents = null;
}

/**
 * Clear AsyncStorage cache (called on app close)
 */
export async function clearABTCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    inMemoryEvents = null;
  } catch (error) {
    console.error('Error clearing ABT cache:', error);
  }
}

/**
 * Get cached events from AsyncStorage (for initial load)
 */
export async function getCachedEvents(): Promise<ABTEvent[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const events = JSON.parse(cached);
      // Also set in memory
      setInMemoryEvents(events);
      return events;
    }
    // If no cache, return seed data
    setInMemoryEvents(SEED_EVENTS);
    await cacheEvents(SEED_EVENTS);
    return SEED_EVENTS;
  } catch (error) {
    console.error('Error getting cached events:', error);
    // Return seed data as fallback
    setInMemoryEvents(SEED_EVENTS);
    return SEED_EVENTS;
  }
}

/**
 * Cache events in AsyncStorage (temporary, cleared on app close)
 */
export async function cacheEvents(events: ABTEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(events));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error caching events:', error);
  }
}

/**
 * Get ABT events - tries multiple methods
 */
export async function getABTEvents(forceRefresh: boolean = false): Promise<ABTEvent[]> {
  // If not forcing refresh, try cache first
  if (!forceRefresh) {
    const memoryEvents = getInMemoryEvents();
    if (memoryEvents && memoryEvents.length > 0) {
      return memoryEvents;
    }
    
    const cachedEvents = await getCachedEvents();
    if (cachedEvents && cachedEvents.length > 0) {
      return cachedEvents;
    }
  }
  
  // Try direct fetch
  try {
    const events = await fetchABTEventsDirect();
    return events;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    // Return seed data as final fallback
    return SEED_EVENTS;
  }
}
