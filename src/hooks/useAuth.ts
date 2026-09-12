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
 *
 * Chamado **uma vez só**, no `App.tsx`, e repassado como prop pra quem
 * precisar (`AppNavbar`, `BarrageSidebar`) — não é seguro chamar de novo em
 * cada componente: são instâncias de `useState` independentes, sem
 * dedupe automático (diferente dos hooks de React Query), então um
 * `logout()` feito na navbar não se refletiria numa segunda instância em
 * outro componente.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(loadToken);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!token) {
      setCheckingSession(false);
      return;
    }
    const controller = new AbortController();
    fetchMe(token, controller.signal)
      .then((me) => setUser(me))
      .catch(() => {
        // Cancelado (StrictMode do React roda o efeito 2x em dev — monta,
        // desmonta/aborta, monta de novo — ou o componente desmontou de
        // verdade) não significa token inválido; só a 2ª chamada, que não
        // foi abortada, deve decidir isso. Sem esse cheque, a 1ª chamada
        // (abortada) sempre caía aqui e apagava o token bom do
        // localStorage antes da 2ª sequer terminar — bug real que fazia
        // "perder o login" a cada carga de página em dev.
        if (controller.signal.aborted) return;
        clearToken();
        setToken(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setCheckingSession(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na 1ª carga
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const newToken = await apiLogin(email, password);
    const me = await fetchMe(newToken).catch(() => {
      // token válido (login não teria devolvido) mas /me falhou por algum
      // motivo transitório — ainda assim guarda o token; próxima carga da
      // página revalida.
      return null;
    });
    saveToken(newToken);
    setToken(newToken);
    if (me) setUser(me);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  return { user, token, checkingSession, login, logout };
}

export type AuthState = ReturnType<typeof useAuth>;

export { AuthError };
