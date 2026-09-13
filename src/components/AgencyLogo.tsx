import spaguasLogo from "@/assets/spaguas-agencia-logo.png";
import sibhLogo from "@/assets/spaguas-logo.png";

/**
 * Logos no canto inferior direito do mapa (pedido do usuário, 2026-09-13):
 * SP Águas (agência) em cima, SIBH embaixo — o print não carrega a navbar
 * (fica fora de `.app-shell`), então sem isso a imagem exportada não teria
 * nenhuma referência explícita ao SIBH. Puramente decorativo
 * (`pointer-events:none`), não some no modo captura — é conteúdo/identidade
 * visual, não um controle de UI.
 */
export default function AgencyLogo() {
  return (
    <div className="map-agency-logo">
      <img
        src={spaguasLogo}
        alt="SP Águas — Agência de Águas do Estado de São Paulo"
        className="map-agency-logo__spaguas"
      />
      {/* `spaguas-logo.png` é o wordmark SIBH branco (usado no LoginModal,
          sobre fundo azul) — aqui o fundo é claro, então vira preto via
          filtro CSS (`brightness(0)`, mesma cor do texto da logo da SP
          Águas), sem precisar de um arquivo novo. */}
      <img
        src={sibhLogo}
        alt="SIBH"
        className="map-agency-logo__sibh"
      />
    </div>
  );
}
