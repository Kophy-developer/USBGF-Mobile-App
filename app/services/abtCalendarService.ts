import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ABTEvent {
  id: string;
  dateRange: string;
  title: string;
  location: string;
  month: string;
  year: string;
}

const ABT_CALENDAR_URL = 'https://usbgf.org/abt-calendar/';
const CACHE_KEY = 'abt_calendar_events';
const CACHE_TIMESTAMP_KEY = 'abt_calendar_timestamp';

let inMemoryEvents: ABTEvent[] | null = null;
let isFetching = false;

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

export function parseABTEventsFromHTML(html: string): ABTEvent[] {
  const events: ABTEvent[] = [];
  
  try {
    const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    const monthYearPattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi;
    const dateRangePattern = /(\d{1,2}\s*[-–—]\s*\d{1,2}\s+[A-Z]{3}|\d{1,2}\s+[A-Z]{3})/gi;
    
    const monthSections: Array<{ month: string; year: string; index: number }> = [];
    let match;
    
    while ((match = monthYearPattern.exec(cleanHtml)) !== null) {
      monthSections.push({
        month: match[1],
        year: match[2],
        index: match.index,
      });
    }
    
    monthSections.forEach((monthSection, monthIndex) => {
      const startIndex = monthSection.index;
      const endIndex = monthIndex < monthSections.length - 1 
        ? monthSections[monthIndex + 1].index 
        : cleanHtml.length;
      
      const sectionHtml = cleanHtml.substring(startIndex, endIndex);
      
      const dateMatches: Array<{ dateRange: string; index: number }> = [];
      let dateMatch;
      const localDatePattern = new RegExp(dateRangePattern.source, 'gi');
      
      while ((dateMatch = localDatePattern.exec(sectionHtml)) !== null) {
        dateMatches.push({
          dateRange: dateMatch[1].trim(),
          index: dateMatch.index,
        });
      }
      
      dateMatches.forEach((dateMatch) => {
        const afterDate = sectionHtml.substring(
          dateMatch.index + dateMatch.dateRange.length,
          dateMatch.index + dateMatch.dateRange.length + 500
        );
        
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
        
        const locationPattern = /(?:Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Monday)[,\s]+([^<]{10,80}?)(?:,|$|\.|<|EVENT)/i;
        const locationMatch = afterDate.match(locationPattern);
        const location = locationMatch ? locationMatch[1].trim() : '';
        
        if (title && title.length > 10 && location && location.length > 5) {
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
    
    return SEED_EVENTS;
  } catch (error) {
    console.error('Direct fetch failed:', error);
    return SEED_EVENTS;
  } finally {
    isFetching = false;
  }
}

export function setInMemoryEvents(events: ABTEvent[]): void {
  inMemoryEvents = events;
}

export function getInMemoryEvents(): ABTEvent[] | null {
  return inMemoryEvents;
}

export function clearInMemoryCache(): void {
  inMemoryEvents = null;
}

export async function clearABTCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    inMemoryEvents = null;
  } catch (error) {
    console.error('Error clearing ABT cache:', error);
  }
}

export async function getCachedEvents(): Promise<ABTEvent[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const events = JSON.parse(cached);
      setInMemoryEvents(events);
      return events;
    }
    setInMemoryEvents(SEED_EVENTS);
    await cacheEvents(SEED_EVENTS);
    return SEED_EVENTS;
  } catch (error) {
    console.error('Error getting cached events:', error);
    setInMemoryEvents(SEED_EVENTS);
    return SEED_EVENTS;
  }
}

export async function cacheEvents(events: ABTEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(events));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error caching events:', error);
  }
}

export async function getABTEvents(forceRefresh: boolean = false): Promise<ABTEvent[]> {
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
  
  try {
    const events = await fetchABTEventsDirect();
    return events;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return SEED_EVENTS;
  }
}
