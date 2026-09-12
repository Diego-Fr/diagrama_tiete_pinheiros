import { API_BASE } from "@/api/base";

/** Payload decodificado de `POST /v2/auth/me` (também é o "shape" do usuário
 * logado usado na UI). */
export interface AuthUser {
  name: string;
  email: string;
  roles: string[];
  /** Unix timestamp (segundos) de expiração do token — mesmo campo do JWT. */
  exp: number;
}

/** Erro de autenticação com a mensagem já pronta pra mostrar ao usuário
 * (traduzida/limpa a partir do `error` cru da API). */
export class AuthError extends Error {}

interface RawLoginResponse {
  token?: string;
  error?: string;
}
interface RawMeResponse {
  name?: string;
  email?: string;
  roles?: string[];
  exp?: number;
  error?: string;
}

/**
 * `POST /v2/auth/login` — credenciais em texto puro no corpo, devolve um
 * bearer token (JWT) em caso de sucesso. Lança `AuthError` com mensagem
 * amigável em caso de credenciais inválidas ou falha de rede/servidor.
 */
export async function login(
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/v2/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal,
    });
  } catch {
    throw new AuthError("Não foi possível conectar ao servidor. Tente novamente.");
  }

  const raw = (await res.json().catch(() => ({}))) as RawLoginResponse;

  if (!res.ok || !raw.token) {
    if (res.status === 401) {
      throw new AuthError("E-mail ou senha inválidos.");
    }
    throw new AuthError(raw.error ?? "Não foi possível entrar. Tente novamente.");
  }

  return raw.token;
}

/**
 * `POST /v2/auth/me` (com `Authorization: Bearer <token>`) — valida o token
 * e devolve os dados do usuário logado (inclusive `exp`, útil pra saber
 * quando expira sem precisar decodificar o JWT à mão). Lança `AuthError` se
 * o token for inválido/expirado.
 */
export async function fetchMe(token: string, signal?: AbortSignal): Promise<AuthUser> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/v2/auth/me`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
  } catch {
    throw new AuthError("Não foi possível validar a sessão.");
  }

  const raw = (await res.json().catch(() => ({}))) as RawMeResponse;

  if (!res.ok || !raw.name) {
    throw new AuthError(raw.error ?? "Sessão inválida.");
  }

  return {
    name: raw.name,
    email: raw.email ?? "",
    roles: raw.roles ?? [],
    exp: raw.exp ?? 0,
  };
}
