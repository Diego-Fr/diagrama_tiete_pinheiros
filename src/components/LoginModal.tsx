import { useEffect, useState, type FormEvent } from "react";
import sibhLogo from "@/assets/spaguas-logo.png";
import { AuthError } from "@/hooks/useAuth";

interface LoginModalProps {
  onClose: () => void;
  /** `useAuth().login` repassado pela navbar — mantém uma única sessão/token
   * (não uma instância de `useAuth` por modal). Lança `AuthError` com
   * mensagem pronta pra mostrar em caso de credenciais inválidas/falha. */
  onLogin: (email: string, password: string) => Promise<void>;
}

/**
 * Modal de login (centralizado), aberto pelo botão "Entrar"/"Bem-vindo" da
 * navbar. Sessão real via `POST /v2/auth/login` (ver `src/api/auth.ts` e
 * `src/hooks/useAuth.ts`) — token guardado em localStorage pelo hook.
 */
export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-modal" role="dialog" aria-modal="true" aria-label="Entrar" onClick={onClose}>
      <div className="login-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="login-modal__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="login-modal__brand">
          <img src={sibhLogo} alt="SIBH" className="login-modal__logo" />
        </div>

        <form className="login-modal__form" onSubmit={handleSubmit}>
          <label className="login-modal__field">
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </label>
          <label className="login-modal__field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </label>

          {error && <p className="login-modal__error">{error}</p>}

          <button type="submit" className="login-modal__submit" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
