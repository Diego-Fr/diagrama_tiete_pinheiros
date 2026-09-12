interface MapControlsProps {
  onOpenSettings: () => void;
  onRecenter: () => void;
  onResetPositions: () => void;
  /** Desabilita o botão de resetar quando não há caixa arrastada manualmente. */
  hasCustomPositions: boolean;
  /** Baixa um print (PNG) do mapa como está agora. */
  onCapture: () => void;
  /** Captura em andamento — desabilita o botão e troca o ícone por um spinner. */
  capturing: boolean;
}

/**
 * Botões abaixo do controle de zoom do Leaflet: configurações, centralizar o
 * mapa no enquadramento inicial, resetar as caixas arrastadas manualmente e
 * baixar um print do mapa.
 */
export default function MapControls({
  onOpenSettings,
  onRecenter,
  onResetPositions,
  hasCustomPositions,
  onCapture,
  capturing,
}: MapControlsProps) {
  return (
    <div className="map-controls">
      <button
        type="button"
        className="map-controls__btn"
        onClick={onOpenSettings}
        aria-label="Configurações"
        title="Configurações"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <span className="map-controls__sep" />

      <button
        type="button"
        className="map-controls__btn"
        onClick={onRecenter}
        aria-label="Centralizar mapa"
        title="Centralizar mapa"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>

      <span className="map-controls__sep" />

      <button
        type="button"
        className="map-controls__btn"
        onClick={onResetPositions}
        disabled={!hasCustomPositions}
        aria-label="Resetar posições das caixas"
        title="Resetar posições das caixas"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
      </button>

      <span className="map-controls__sep" />

      <button
        type="button"
        className="map-controls__btn"
        onClick={onCapture}
        disabled={capturing}
        aria-label="Baixar imagem do mapa"
        title="Baixar imagem do mapa"
      >
        {capturing ? (
          <svg
            className="map-controls__spinner"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
            <circle cx="12" cy="14" r="3.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
