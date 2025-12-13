const BASE_URL = 'https://sp-usbgf.3kguzm.easypanel.host/api';
const MEMBERPRESS_API_BASE = 'https://usbgf.org/wp-json/mp/v1';
const MEMBERPRESS_API_KEY = 'BYKWSIitfo';
const PERIOD_ID = 1988;

interface ApiOptions extends RequestInit {
  token?: string | null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let message = text || `Request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.message) {
        message = parsed.message;
      } else if (parsed?.error?.message) {
        message = parsed.error.message;
      }
    } catch (e) {
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function apiRequest<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
        signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

      clearTimeout(timeoutId);
  return handleResponse<T>(response);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      throw fetchError;
    }
  } catch (error: any) {
    const errorMessage = error?.message?.toLowerCase() || '';
    if (errorMessage.includes('network request failed') || 
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('networkerror') ||
        errorMessage.includes('typeerror')) {
      throw new Error('Network request failed. Please check your internet connection and try again.');
    }
    throw error;
  }
}

async function memberPressRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${MEMBERPRESS_API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'MEMBERPRESS-API-KEY': MEMBERPRESS_API_KEY,
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || `Request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.message) {
        message = parsed.message;
      }
    } catch (e) {
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export interface LoginResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: {
    token: string;
    user: {
      id: number;
      playerId: number;
      username: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      avatar?: string;
    };
  };
  error: any;
}

export async function loginRequest(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export interface UpcomingMatchesPayload {
  awaitingResults: any[];
  awaitingOpponent: any[];
  awaitingDraw: any[];
  isSelf?: boolean;
  isOnlineClub?: boolean;
}

export interface UpcomingMatchesResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: UpcomingMatchesPayload;
}

export interface MatchSummary {
  date: string;
  opponent?: {
    id?: number;
    name?: string;
    rating?: string | number | null;
  };
  result?: string | null;
  matchLength?: number | null;
  playerRating?: string | number | null;
  matchPoints?: string | number | null;
  event?: {
    id?: number;
    name?: string;
    [key: string]: any;
  };
  matchFile?: string | null;
  isAllowUploadMatchFile?: boolean;
  matchId?: number;
  [key: string]: any;
}

export interface MatchesListResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: MatchSummary[];
}

export async function fetchMatches(token: string, clubId: number): Promise<MatchSummary[]> {
  const url = `/matches?clubId=${clubId}&periodId=${PERIOD_ID}`;
  console.log(`[API] Fetching matches from: ${BASE_URL}${url}`);
  const response = await apiRequest<MatchesListResponse>(url, {
    method: 'GET',
    token,
  });
  console.log(`[API] Matches response:`, { 
    status: response.status, 
    dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
    message: response.message 
  });
  return response.data ?? [];
}

export async function fetchUpcomingMatches(token: string, params: { clubId?: number; playerId?: number }): Promise<UpcomingMatchesPayload> {
  const searchParams = new URLSearchParams();
  if (typeof params.clubId === 'number') {
    searchParams.append('clubId', String(params.clubId));
  }
  if (typeof params.playerId === 'number') {
    searchParams.append('playerId', String(params.playerId));
  }
  const query = searchParams.toString();
  const url = `/matches/upcoming${query ? `?${query}` : ''}`;
  console.log(`[API] Fetching upcoming matches from: ${BASE_URL}${url}`);
  const response = await apiRequest<UpcomingMatchesResponse>(url, {
    method: 'GET',
    token,
  });
  console.log(`[API] Upcoming matches response:`, { 
    status: response.status, 
    message: response.message,
    dataKeys: response.data ? Object.keys(response.data) : 'no data'
  });
  return response.data;
}

export interface EventSummary {
  id: number;
  name: string;
  nameWithTournament?: string;
  isPlayStarted?: boolean;
  skill?: number;
  entry?: number;
  position?: number;
  userIsEntered?: boolean;
  start?: string;
  end?: string;
  tournament?: {
    id?: number;
    name?: string;
    start?: string;
    end?: string;
  };
  numEntries?: number | string;
  winner?: string;
  [key: string]: any;
}

export interface EventsPayload {
  events: EventSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface EventsResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: EventsPayload;
}

export async function fetchEvents(token: string, params: { clubId: number; playerId?: number; player?: number; tab?: string; page?: number; limit?: number }): Promise<EventsPayload> {
  const searchParams = new URLSearchParams();
  searchParams.append('clubId', String(params.clubId));
  if (typeof params.playerId === 'number' && !Number.isNaN(params.playerId)) {
    searchParams.append('playerId', String(params.playerId));
  }
  if (typeof params.player === 'number' && !Number.isNaN(params.player)) {
    searchParams.append('player', String(params.player));
  }
  if (params.tab && typeof params.tab === 'string') {
    searchParams.append('tab', params.tab);
  }
  if (typeof params.page === 'number') {
    searchParams.append('page', String(params.page));
  }
  if (typeof params.limit === 'number') {
    searchParams.append('limit', String(params.limit));
  }

  const response = await apiRequest<EventsResponse>(`/events?${searchParams.toString()}`, {
    method: 'GET',
    token,
  });
  return response.data;
}

export interface EventAbout {
  directorName?: string | null;
  eventLevel?: string | number | null;
  daysBetweenRounds?: number | null;
  tournamentDescription?: string | null;
  start?: string | null;
  skillLevel?: number | null;
}

export type EligibilityRule = [string, string, boolean];

export interface EventPlayerEntry {
  player?: {
    id?: number;
    name?: string;
    lastFirstName?: string;
  };
  entrantId?: number | string;
  contestantId?: number | string;
  entryId?: number | string;
  registrationId?: number | string;
  id?: number | string;
  winLose?: {
    text?: string;
    sort?: number;
  };
  isPlayStarted?: boolean;
  status?: string | null;
  opponent?: any;
  location?: {
    eventId?: number;
    bracketId?: number;
    label?: string;
  };
  isBlockedFromBye?: boolean;
  eligible?: boolean;
  sidePools?: any;
  isDoneWithPlay?: boolean | null;
}

export interface EventPlayersSummary {
  players: EventPlayerEntry[];
  mainFlightFormat?: number;
  isUseTableNumbers?: boolean;
  eventIsCompleted?: boolean;
  eventIsStarted?: boolean;
  numUniqueEntries?: number;
  numTotalEntries?: number;
  numParticipants?: number;
  numAliveEntries?: number;
  numFinishedEntries?: number;
  isAllowReport?: boolean;
  isAllowViewContactInfo?: boolean;
}

export interface EventDetailsPayload {
  about?: EventAbout;
  eligibility?: EligibilityRule[];
  players?: EventPlayersSummary;
}

export interface EventDetailsResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: EventDetailsPayload;
}

export async function fetchEventDetails(token: string, eventId: number): Promise<EventDetailsPayload> {
  const response = await apiRequest<EventDetailsResponse>(`/events/${eventId}`, {
    method: 'GET',
    token,
  });
  return response.data;
}

// ABT Calendar (public)
export interface CalendarEvent {
  id: number;
  post_id: number;
  title: string;
  description: string;
  start: string;
  end: string;
  start_time?: string;
  end_time?: string;
  featured_image: string | false;
  categories: string[];
}

export interface CalendarResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: {
    page: number;
    per_page: number;
    count: number;
    events: CalendarEvent[];
  };
  error: any;
}

export async function fetchABTCalendar(page = 1): Promise<CalendarEvent[]> {
  const response = await apiRequest<CalendarResponse>(`/general/calendar?page=${page}`, {
    method: 'GET',
  });
  return response?.data?.events ?? [];
}

export interface EnterEventResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data?: any;
}

export async function enterEvent(token: string, eventId: number): Promise<EnterEventResponse> {
  return apiRequest<EnterEventResponse>('/events/enter', {
    method: 'POST',
    token,
    body: JSON.stringify({ eventId: String(eventId) }),
  });
}

export interface WithdrawEventResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data?: any;
}

export async function withdrawEvent(token: string, entrantId: number): Promise<WithdrawEventResponse> {
  return apiRequest<WithdrawEventResponse>('/events/withdraw', {
    method: 'POST',
    token,
    body: JSON.stringify({ entrantId: String(entrantId) }),
  });
}

export interface UserProfileNickName {
  site?: string;
  name?: string;
}

export interface UserProfileData {
  id?: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  memberLevel?: number;
  memberType?: string;
  state?: string;
  country?: string;
  timezone?: string;
  phone?: string;
  phoneStatus?: string;
  nicknames?: UserProfileNickName[];
  avatar?: string;
}

export interface UserAccountInfo {
  userAccount?: {
    accountId?: number;
    userId?: number;
    name?: string;
    lastFirstName?: string;
    cash?: number;
    credits?: number;
  };
  isAllowManageUserAccounts?: boolean;
  isAllowManageClubPlayers?: boolean;
  isAllowViewClubs?: boolean;
}

export interface UserProfileResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: UserProfileData & {
    userAccountInfo?: UserAccountInfo;
    avatar?: {
      full?: string;
      thumb?: string;
      is_default?: boolean;
    };
  };
  error?: any;
}

export async function fetchUserProfile(token: string, playerId?: number): Promise<UserProfileResponse['data']> {
  const searchParams = new URLSearchParams();
  if (typeof playerId === 'number') {
    searchParams.append('playerId', String(playerId));
  }
  const query = searchParams.toString();
  const response = await apiRequest<UserProfileResponse>(`/user/profile${query ? `?${query}` : ''}`, {
    method: 'GET',
    token,
  });
  return response.data;
}

export interface MemberPressTransaction {
  id: string;
  created_at?: string;
  amount?: string;
  total?: string;
  status?: string;
  txn_type?: string;
  trans_num?: string;
}

export async function fetchMemberTransactions(memberId: number): Promise<MemberPressTransaction[]> {
  if (!memberId) {
    return [];
  }
  return memberPressRequest<MemberPressTransaction[]>(`/transactions?member=${memberId}`);
}

export interface UserTransaction {
  id?: number | string;
  timestamp?: string;
  date?: string;
  created_at?: string;
  description?: string;
  cashAmount?: number | string;
  creditsAmount?: number | string;
  newCashBalance?: number | string;
  newCreditsBalance?: number | string;
  amount?: number | string;
  total?: number | string;
  balance?: number | string;
  status?: string;
  txn_type?: string;
  trans_num?: string;
  updatedBy?: string;
  [key: string]: any;
}

export interface UserTransactionsResponse {
  message?: string;
  status?: boolean;
  statusCode?: number;
  data?: UserTransaction[];
  error?: any;
}

export async function fetchUserTransactions(
  token: string,
  userAccountId: number
): Promise<UserTransaction[]> {
  if (!userAccountId) {
    return [];
  }
  const response = await apiRequest<UserTransactionsResponse>(
    `/user/transactions/${userAccountId}`,
    {
      method: 'GET',
      token,
    }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export interface UserStatsPeriod {
  id: number;
  LastEloRating?: number;
  LastEloRatingHigh?: number;
  Experience?: number;
  TotalMasterPointsReceived?: number;
  MatchPointsReceived?: number;
  RankPointsReceived?: number;
  MatchesWon?: number;
  MatchesLost?: number;
  EventsEntered?: number;
  EventsWon?: number;
  EventsPlaced?: number;
  periodName?: string;
}

export interface UserStatsPayload {
  yearly: UserStatsPeriod[];
  allTime: UserStatsPeriod[];
}

export interface UserStatsResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: UserStatsPayload;
  error?: any;
}

export async function fetchUserStats(token: string, playerId?: number, clubId?: number): Promise<UserStatsPayload> {
  const searchParams = new URLSearchParams();
  if (typeof playerId === 'number') {
    searchParams.append('playerId', String(playerId));
  }
  if (typeof clubId === 'number') {
    searchParams.append('clubId', String(clubId));
  }
  const query = searchParams.toString();
  const response = await apiRequest<UserStatsResponse>(`/user/stats${query ? `?${query}` : ''}`, {
    method: 'GET',
    token,
  });
  return response.data;
}

export interface ReportMatchResultParams {
  contestId: number;
  winnerFactContestantId: number;
}

export async function reportMatchResult(
  token: string,
  { contestId, winnerFactContestantId }: ReportMatchResultParams
): Promise<any> {
  const formData = new FormData();
  formData.append('contestId', String(contestId));
  formData.append('winnerFactContestantIds', String(winnerFactContestantId));

  const response = await fetch(`${BASE_URL}/events/match/report-match`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  // Try to parse the response even if status is not ok
  let responseData: any = null;
  try {
    const text = await response.text();
    if (text) {
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        // If not JSON, responseData remains null
      }
      }
    } catch (e) {
    // Ignore parsing errors
  }

  // If response is successful (2xx), ensure backend status is true; otherwise throw
  if (response.ok || (response.status >= 200 && response.status < 300)) {
    // Some endpoints return {status:boolean,message:string}
    if (responseData && responseData.status === false) {
      throw new Error(responseData.message || 'Unable to report match.');
  }
    // If no response body, treat as error to avoid false positives
    if (!responseData) {
      throw new Error('No response from server while reporting match.');
    }
    return responseData;
  }

  // For non-success status codes, check if the error is about match files
  // If it is, we still treat it as success since match files are no longer required
  if (responseData?.message) {
    const errorMessage = String(responseData.message).toLowerCase();
    const isMatchFileError = 
      errorMessage.includes('match file') ||
      errorMessage.includes('matchfile') ||
      errorMessage.includes('file required') ||
      errorMessage.includes('file is required') ||
      errorMessage.includes('match file needed') ||
      errorMessage.includes('match file required');
    
    if (isMatchFileError) {
      // Match was reported successfully, just ignore the match file warning
      return responseData;
  }
  }

  // For other errors, throw normally
  const errorMessage = responseData?.message || `Request failed with status ${response.status}`;
  throw new Error(errorMessage);
}

export interface UnreportMatchParams {
  entrantId: number | string;
}

export async function unreportMatch(
  token: string,
  { entrantId }: UnreportMatchParams
): Promise<any> {
  const response = await apiRequest<any>('/events/match/report-match', {
    method: 'POST',
    token,
    body: JSON.stringify({
      entrantId: String(entrantId),
    }),
  });
  return response;
}

export interface ProfilePictureResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data?: {
    urls?: Record<string, string>;
    meta?: {
      profile_picture_url?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  error?: any;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_phone?: string;
  state?: string;
  country?: string;
  timezone?: string;
}

export interface UpdateProfileResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data?: {
    id?: number;
    email?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    state?: string;
    country?: string;
    mobile_phone?: string;
    [key: string]: any;
  };
  error?: any;
}

export async function updateProfile(
  token: string,
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> {
  return await apiRequest<UpdateProfileResponse>('/user/profile', {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}

export async function updateProfilePicture(
  token: string,
  file: { uri: string; name: string; type: string }
): Promise<ProfilePictureResponse> {
  const formData = new FormData();
  formData.append('picture', file as any);

  const response = await fetch(`${BASE_URL}/user/profile/picture`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: formData,
  });

  return handleResponse<ProfilePictureResponse>(response);
}

export interface BracketListResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: Array<{ id: number; name: string; type: string }>;
}

export async function fetchBracketList(token: string, eventId: number): Promise<BracketListResponse['data']> {
  const response = await apiRequest<BracketListResponse>(`/events/brackets?eventId=${eventId}`, {
    method: 'GET',
    token,
  });
  return response.data;
}

export interface BracketInfoResponse {
  success: boolean;
  data: {
    type: string;
    data: any;
    children: BracketNode[];
  };
  error?: { message?: string | null };
}

export interface BracketNode {
  type: string;
  data: any;
  children?: BracketNode[];
}

export async function fetchBracketInfo(token: string, bracketId: number, fromRound?: number): Promise<BracketInfoResponse> {
  const params = new URLSearchParams({ bracketId: String(bracketId) });
  if (typeof fromRound === 'number') {
    params.append('fromRound', String(fromRound));
  }
  return apiRequest<BracketInfoResponse>(`/events/brackets/info?${params.toString()}`, {
    method: 'GET',
    token,
  });
}

export const MATCHES_PERIOD_ID = PERIOD_ID;

export interface Message {
  id?: string | number;
  content?: string;
  sender?: number | string;
  receiver?: number | string;
  participant?: number | string;
  timestamp?: string;
  created_at?: string;
  [key: string]: any;
}

export interface SendMessageRequest {
  content: string;
  receiver: string | number; // playerID
}

export interface SendMessageResponse {
  message?: string;
  status?: boolean;
  statusCode?: number;
  data?: any;
  error?: any;
}

export interface MessagesResponse {
  message?: string;
  status?: boolean;
  statusCode?: number;
  data?: Message[];
  error?: any;
}

export interface Contact {
  id?: number | string;
  playerId?: number | string;
  name?: string;
  avatar?: string;
  [key: string]: any;
}

export interface ContactsResponse {
  message?: string;
  status?: boolean;
  statusCode?: number;
  data?: Contact[];
  error?: any;
}

export async function sendMessage(
  token: string,
  { content, receiver }: SendMessageRequest
): Promise<SendMessageResponse> {
  try {
    return await apiRequest<SendMessageResponse>('/message/send', {
      method: 'POST',
      token,
      body: JSON.stringify({ 
        content: String(content).trim(), 
        receiver: String(receiver) 
      }),
    });
  } catch (error: any) {
    const errorMessage = error?.message?.toLowerCase() || '';
    if (errorMessage.includes('retries')) {
      throw new Error('Server connection issue. Please try again in a moment.');
    }
    if (errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
      throw new Error('Please sign in again to send messages.');
    }
    if (errorMessage.includes('receiver') || errorMessage.includes('invalid')) {
      throw new Error('Invalid recipient. Please check the contact information.');
    }
    throw error;
  }
}

export async function fetchMessages(
  token: string,
  participantId: number | string
): Promise<Message[]> {
  try {
    const response = await apiRequest<MessagesResponse>(
      `/message/messages?participant=${participantId}`,
      {
        method: 'GET',
        token,
      }
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    const errorMessage = error?.message?.toLowerCase() || '';
    if (
      errorMessage.includes('retries') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('no messages') ||
      errorMessage.includes('empty')
    ) {
      return [];
    }
    throw error;
  }
}

export async function fetchContacts(token: string): Promise<Contact[]> {
  const response = await apiRequest<ContactsResponse>('/message/contacts', {
    method: 'GET',
    token,
  });
  return Array.isArray(response.data) ? response.data : [];
}

// New messaging API interfaces and functions
export interface MessageThread {
  message_id: number;
  current_user: number;
  recipients: Array<{
    id: number;
    user_id: number;
    username: string;
    avatar: {
      full: string;
      thumb: string;
    };
  }>;
  last_message: {
    message: string;
    date: string;
    sender: {
      sender_name: string;
      user_avatars: {
        full: string;
        thumb: string;
      };
    };
    display_date: string;
  };
  all_messages: any;
}

export interface AllMessagesResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: MessageThread[];
  error?: any;
}

export interface MessageDetailResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: {
    message_id: number;
    current_user: number;
    recipients: Array<{
      id: number;
      user_id: number;
      username: string;
      avatar: {
        full: string;
        thumb: string;
      };
    }>;
    last_message: {
      message: string;
      date: string;
      sender: {
        sender_name: string;
        user_avatars: {
          full: string;
          thumb: string;
        };
      };
      display_date: string;
    };
    all_messages: Array<{
      message: string;
      date: string;
      sender: {
        sender_name: string;
        user_avatars: {
          full: string;
          thumb: string;
        };
      };
      display_date: string;
    }>;
  };
  error?: any;
}

export interface SendMessageNewRequest {
  content: string;
  receiver: string | number; // playerID
  receiverUsername: string; // email
}

/**
 * Get all message threads for the logged-in user
 */
export async function fetchAllMessages(token: string): Promise<MessageThread[]> {
  try {
    const response = await apiRequest<AllMessagesResponse>('/message/messages', {
      method: 'GET',
      token,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    const errorMessage = error?.message?.toLowerCase() || '';
    if (
      errorMessage.includes('retries') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('no messages') ||
      errorMessage.includes('empty')
    ) {
      return [];
    }
    throw error;
  }
}

/**
 * Get message details by messageId
 */
export async function fetchMessageDetails(token: string, messageId: number): Promise<MessageDetailResponse['data']> {
  const response = await apiRequest<MessageDetailResponse>(`/message/messages/${messageId}`, {
    method: 'GET',
    token,
  });
  return response.data;
}

/**
 * Send a message using the new endpoint format
 */
export async function sendMessageNew(
  token: string,
  { content, receiver, receiverUsername }: SendMessageNewRequest
): Promise<SendMessageResponse> {
  try {
    return await apiRequest<SendMessageResponse>('/message/send', {
      method: 'POST',
      token,
      body: JSON.stringify({ 
        content: String(content).trim(), 
        receiver: String(receiver),
        receiverUsername: String(receiverUsername),
      }),
    });
  } catch (error: any) {
    const errorMessage = error?.message?.toLowerCase() || '';
    if (errorMessage.includes('retries')) {
      throw new Error('Server connection issue. Please try again in a moment.');
    }
    if (errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
      throw new Error('Please sign in again to send messages.');
    }
    if (errorMessage.includes('receiver') || errorMessage.includes('invalid')) {
      throw new Error('Invalid recipient. Please check the contact information.');
    }
    throw error;
  }
}

