const BASE_URL = 'https://sp-usbgf.3kguzm.easypanel.host/api';
const PERIOD_ID = 1988;

interface ApiOptions extends RequestInit {
  token?: string | null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
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

export interface MatchesPayload {
  awaitingResults: any[];
  awaitingOpponent: any[];
  awaitingDraw: any[];
  isSelf?: boolean;
  isOnlineClub?: boolean;
}

export interface MatchesResponse {
  message: string;
  status: boolean;
  statusCode: number;
  data: MatchesPayload;
}

export async function fetchMatches(token: string, clubId: number): Promise<MatchesPayload> {
  const response = await apiRequest<MatchesResponse>(`/matches?clubId=${clubId}&periodId=${PERIOD_ID}`, {
    method: 'GET',
    token,
  });
  return response.data;
}

export async function fetchUpcomingMatches(token: string, params: { clubId?: number; playerId?: number }): Promise<MatchesPayload> {
  const searchParams = new URLSearchParams();
  if (typeof params.clubId === 'number') {
    searchParams.append('clubId', String(params.clubId));
  }
  if (typeof params.playerId === 'number') {
    searchParams.append('playerId', String(params.playerId));
  }
  const query = searchParams.toString();
  const response = await apiRequest<MatchesResponse>(`/matches/upcoming${query ? `?${query}` : ''}`, {
    method: 'GET',
    token,
  });
  return response.data;
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

