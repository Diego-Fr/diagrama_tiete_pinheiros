import { useEffect, useRef, useState } from "react";
import { NAV_ITEMS } from "@/config/nav";
import LoginModal from "@/components/LoginModal";
import type { AuthState } from "@/hooks/useAuth";

const SIBH_HOME_URL = "https://apps.spaguas.sp.gov.br/sibh/";

interface AppNavbarProps {
  /** `useAuth()` chamado uma vez só em `App.tsx` — ver comentário no hook. */
  auth: AuthState;
}

/** Primeiro nome só, pro "Bem-vindo" não ficar gigante com nome completo. */
function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/**
 * Navbar principal (SIBH), replicando o essencial da navbar do app Rails em
 * produção: logo (clicável, abre o SIBH de produção numa aba nova), os 4
 * menus com submenu abrindo no HOVER (sem "Operação", por pedido) e, à
 * direita, sessão real via `useAuth` — token JWT de `/v2/auth/login` salvo
 * em localStorage e revalidado contra `/v2/auth/me` a cada carga da página;
 * deslogado mostra "Entrar" (abre `LoginModal`), logado mostra "Bem-vindo,
 * <nome>" com um menu de logout. Aparece nas duas visões (mapa e fluxo),
 * fora do `.app-shell` — ver `App.tsx`.
 */
export default function AppNavbar({ auth }: AppNavbarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const { user, checkingSession, login, logout } = auth;

  useEffect(() => {
    if (!openMenu && !userMenuOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpenMenu(null);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [openMenu, userMenuOpen]);

  return (
    <header className="app-navbar" ref={rootRef}>
      <a
        className="app-navbar__brand"
        href={SIBH_HOME_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        SIBH
      </a>

      <nav className="app-navbar__nav" aria-label="Menu principal">
        {NAV_ITEMS.map((item) => {
          const open = openMenu === item.label;
          return (
            <div
              key={item.label}
              className="app-navbar__item"
              onMouseEnter={() => setOpenMenu(item.label)}
              onMouseLeave={() => setOpenMenu((cur) => (cur === item.label ? null : cur))}
            >
              <button
                type="button"
                className={`app-navbar__link${open ? " app-navbar__link--open" : ""}`}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpenMenu((cur) => (cur === item.label ? null : item.label))}
              >
                {item.label}
              </button>
              {open && (
                <ul className="app-navbar__menu" role="menu">
                  {item.items.map((sub) => (
                    <li key={sub.label} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className="app-navbar__menu-item"
                        onClick={() => setOpenMenu(null)}
                      >
                        {sub.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {!checkingSession && user ? (
        <div className="app-navbar__item app-navbar__item--user">
          <button
            type="button"
            className={`app-navbar__welcome${userMenuOpen ? " app-navbar__link--open" : ""}`}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            Bem-vindo, {firstName(user.name)}
            <svg
              className="app-navbar__welcome-chevron"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {userMenuOpen && (
            <ul className="app-navbar__menu app-navbar__menu--right" role="menu">
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="app-navbar__menu-item"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                >
                  Sair
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="app-navbar__login"
          onClick={() => setLoginOpen(true)}
          disabled={checkingSession}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
          <span className="app-navbar__login-label">Entrar</span>
        </button>
      )}

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={login} />}
    </header>
  );
}
