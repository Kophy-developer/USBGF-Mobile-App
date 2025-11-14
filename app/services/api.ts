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
      // text was not JSON, keep original message
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function apiRequest<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  return handleResponse<T>(response);
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
      // ignore
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
  const response = await apiRequest<MatchesListResponse>(`/matches?clubId=${clubId}&periodId=${PERIOD_ID}`, {
    method: 'GET',
    token,
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
  const response = await apiRequest<UpcomingMatchesResponse>(`/matches/upcoming${query ? `?${query}` : ''}`, {
    method: 'GET',
    token,
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

export async function fetchEvents(token: string, params: { clubId: number; playerId?: number; page?: number; limit?: number }): Promise<EventsPayload> {
  const searchParams = new URLSearchParams();
  searchParams.append('clubId', String(params.clubId));
  if (typeof params.playerId === 'number' && !Number.isNaN(params.playerId)) {
    searchParams.append('playerId', String(params.playerId));
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
  data: {
    userProfile: UserProfileData;
    userAccountInfo?: UserAccountInfo;
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

export async function fetchUserStats(token: string, playerId?: number): Promise<UserStatsPayload> {
  const searchParams = new URLSearchParams();
  if (typeof playerId === 'number') {
    searchParams.append('playerId', String(playerId));
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
  matchFile?: {
    uri: string;
    name: string;
    type?: string;
  };
}

export async function reportMatchResult(
  token: string,
  { contestId, winnerFactContestantId, matchFile }: ReportMatchResultParams
): Promise<any> {
  const formData = new FormData();
  formData.append('contestId', String(contestId));
  formData.append('winnerFactContestantIds', String(winnerFactContestantId));
  if (matchFile) {
    formData.append(
      'matchFiles',
      {
        uri: matchFile.uri,
        name: matchFile.name,
        type: matchFile.type ?? 'application/octet-stream',
      } as any
    );
  }

  const response = await fetch(`${BASE_URL}/events/match/report-match`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
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
      // ignore non-JSON responses
    }
    throw new Error(message);
  }

  try {
    return await response.json();
  } catch (e) {
    return null;
  }
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

