/**
 * Card no canto superior direito: seletor de data (ainda não funcional —
 * mostra "AGORA").
 */
export default function MapDateCard() {
  return (
    <div className="map-datecard">
      <button type="button" className="map-datecard__date" disabled>
        <span>AGORA</span>
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
    </div>
  );
}
