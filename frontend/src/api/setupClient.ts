const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface SetupStatus {
  installed: boolean;
  steps: {
    db: boolean;
    openai: boolean;
    telegram: boolean;
  };
}

export interface TestResponse {
  ok: boolean;
  message?: string;
  bot_username?: string;
}

export interface SaveResponse {
  ok: boolean;
  message?: string;
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const response = await fetch(`${API_BASE}/setup/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch setup status');
  }
  return response.json();
}

export async function testDb(payload: {
  driver: 'sqlite' | 'mysql' | 'pgsql';
  host?: string;
  port?: string;
  database: string;
  username?: string;
  password?: string;
}): Promise<TestResponse> {
  const response = await fetch(`${API_BASE}/setup/test-db`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function testOpenAi(payload: {
  api_key: string;
  model: string;
}): Promise<TestResponse> {
  const response = await fetch(`${API_BASE}/setup/test-openai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function testTelegram(payload: {
  bot_token: string;
  chat_id: string;
}): Promise<TestResponse> {
  const response = await fetch(`${API_BASE}/setup/test-telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function saveSetup(payload: {
  db: {
    driver: 'sqlite' | 'mysql' | 'pgsql';
    host?: string;
    port?: string;
    database: string;
    username?: string;
    password?: string;
  };
  openai: {
    api_key: string;
    model: string;
  };
  telegram: {
    bot_token: string;
    chat_id: string;
  };
}): Promise<SaveResponse> {
  const response = await fetch(`${API_BASE}/setup/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}
