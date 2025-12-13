export interface ABTEvent {
  id: string;
  dateRange: string; // e.g., "04 - 07" or "4th to 7th"
  dateRangeFull: string; // e.g., "4th to 7th December, 2025"
  title: string; // e.g., "2025 California State Championship"
  location: string;
  month: string;
  year: string;
  monthAbbr: string; // e.g., "DEC"
  dayStart: number; // e.g., 4
  dayEnd: number; // e.g., 7
}

const ABT_CALENDAR_URL = 'https://usbgf.org/abt-calendar/';

let isFetching = false;

// No seed events - we always fetch fresh data from the website

// Helper function to get ordinal number (1st, 2nd, 3rd, 4th, etc.)
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0];
  return `${n}${suffix}`;
}

// Helper function to get month abbreviation
function getMonthAbbr(month: string): string {
  const months: { [key: string]: string } = {
    'January': 'JAN',
    'February': 'FEB',
    'March': 'MAR',
    'April': 'APR',
    'May': 'MAY',
    'June': 'JUN',
    'July': 'JUL',
    'August': 'AUG',
    'September': 'SEP',
    'October': 'OCT',
    'November': 'NOV',
    'December': 'DEC',
  };
  return months[month] || month.substring(0, 3).toUpperCase();
}

export function parseABTEventsFromHTML(html: string): ABTEvent[] {
  const events: ABTEvent[] = [];
  
  try {
    const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Pattern to find month/year headers
    const monthYearPattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi;
    
    // Pattern to find date ranges like "04 - 07" or "4 - 7" followed by month abbreviation
    const dateRangePattern = /(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([A-Z]{3})/gi;
    
    const monthSections: Array< { month: string; year: string; index: number }> = [];
    let match;
    
    // Find all month sections
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
      
      // Find all date ranges in this section
      const dateMatches: Array<{ dayStart: number; dayEnd: number; monthAbbr: string; index: number }> = [];
      let dateMatch;
      const localDatePattern = new RegExp(dateRangePattern.source, 'gi');
      
      while ((dateMatch = localDatePattern.exec(sectionHtml)) !== null) {
        // Check if the month abbreviation matches
        const expectedAbbr = getMonthAbbr(monthSection.month);
        if (dateMatch[3].toUpperCase() === expectedAbbr) {
        dateMatches.push({
            dayStart: parseInt(dateMatch[1], 10),
            dayEnd: parseInt(dateMatch[2], 10),
            monthAbbr: dateMatch[3].toUpperCase(),
          index: dateMatch.index,
        });
        }
      }
      
      dateMatches.forEach((dateMatch) => {
        // Extract content after the date range
        const afterDate = sectionHtml.substring(
          dateMatch.index + 100, // Look further after the date
          dateMatch.index + 800
        );
        
        // Try multiple patterns to find the title
        const titlePatterns = [
          /<h[234][^>]*>([^<]+?)<\/h[234]>/i,
          /<strong[^>]*>([^<]+?)<\/strong>/i,
          /<b[^>]*>([^<]+?)<\/b>/i,
          />\s*([A-Z][^<]{20,150}?)(?:<|EVENT DETAIL|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Monday)/,
        ];
        
        let title = '';
        for (const pattern of titlePatterns) {
          const titleMatch = afterDate.match(pattern);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim()
              .replace(/\s+/g, ' ')
              .replace(/[<>]/g, '')
              .trim();
            
            // Filter out invalid titles
            if (title.length > 15 && 
                !title.toUpperCase().includes('EVENT DETAIL') && 
                !title.toUpperCase().includes('ABT CALENDAR') &&
                !title.match(/^[A-Z\s]{3,}$/)) { // Not all caps short text
              break;
          }
            title = '';
          }
        }
        
        // Extract location (day of week + venue)
        const locationPattern = /(?:Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Monday)[,\s]+([^<]{10,100}?)(?:,|$|\.|<|EVENT|AM|PM)/i;
        const locationMatch = afterDate.match(locationPattern);
        const location = locationMatch ? locationMatch[1].trim() : '';
        
        if (title && title.length > 15 && location && location.length > 5) {
          // Create formatted date range
          const dateRange = `${dateMatch.dayStart.toString().padStart(2, '0')} - ${dateMatch.dayEnd.toString().padStart(2, '0')}`;
          const dateRangeFull = `${getOrdinalSuffix(dateMatch.dayStart)} to ${getOrdinalSuffix(dateMatch.dayEnd)} ${monthSection.month}, ${monthSection.year}`;
          
            events.push({
            id: `event-${events.length}-${monthSection.month}-${monthSection.year}-${dateMatch.dayStart}`,
            dateRange,
            dateRangeFull,
              title,
              location,
              month: monthSection.month,
              year: monthSection.year,
            monthAbbr: dateMatch.monthAbbr,
            dayStart: dateMatch.dayStart,
            dayEnd: dateMatch.dayEnd,
            });
        }
      });
    });
    
    // Sort events chronologically
    events.sort((a, b) => {
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const yearDiff = parseInt(a.year) - parseInt(b.year);
      if (yearDiff !== 0) return yearDiff;
      const monthDiff = monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      if (monthDiff !== 0) return monthDiff;
      return a.dayStart - b.dayStart;
    });
    
    return events;
  } catch (error) {
    console.error('Error parsing ABT events:', error);
    return [];
  }
}

/**
 * Fetch ABT events using WebView scraper (handles lazy loading)
 * This always fetches fresh data - no caching
 */
export async function fetchABTEvents(): Promise<ABTEvent[]> {
  if (isFetching) {
    // If already fetching, wait for it
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isFetching) {
          clearInterval(checkInterval);
          resolve([]);
        }
      }, 500);
    });
}

  // Note: This function is meant to be used with the WebView scraper
  // The actual scraping is handled in ABTCalendarScreen using the scraper service
  return [];
  }

/**
 * Clear any in-memory cache (for consistency, though we don't cache)
 */
export function clearABTCache(): void {
  // No-op since we don't cache anymore
}
