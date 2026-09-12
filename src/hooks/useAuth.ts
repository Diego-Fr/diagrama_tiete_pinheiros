import { useCallback, useEffect, useState } from "react";
import { AuthError, fetchMe, login as apiLogin, type AuthUser } from "@/api/auth";

const TOKEN_KEY = "diagrama-tiete:auth-token";

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage indisponível */
  }
}
function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage indisponível */
  }
}

/**
 * Sessão do usuário (login via `/v2/auth/login`, bearer token guardado em
 * localStorage). Ao montar, se já existir um token salvo, valida contra
 * `/v2/auth/me` — se ainda for válido, entra logado direto (sem pedir
 * usuário/senha de novo); se estiver expirado/inválido, descarta o token e
 * volta pro estado deslogado, silenciosamente (não é erro pro usuário ver).
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = loadToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    const controller = new AbortController();
    fetchMe(token, controller.signal)
      .then((me) => setUser(me))
      .catch(() => clearToken())
      .finally(() => setCheckingSession(false));
    return () => controller.abort();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const token = await apiLogin(email, password);
    const me = await fetchMe(token).catch(() => {
      // token válido (login não teria devolvido) mas /me falhou por algum
      // motivo transitório — ainda assim guarda o token; próxima carga da
      // página revalida.
      return null;
    });
    saveToken(token);
    if (me) setUser(me);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return { user, checkingSession, login, logout };
}

export { AuthError };
