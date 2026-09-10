import { BOX_FORMAT_OPTIONS, type BoxFormat } from "@/lib/boxFormat";

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
  format: BoxFormat;
  onFormatChange: (format: BoxFormat) => void;
}

/** Painel de configurações à esquerda (aberto pela engrenagem do card de data). */
export default function SettingsSidebar({
  open,
  onClose,
  format,
  onFormatChange,
}: SettingsSidebarProps) {
  if (!open) return null;

  return (
    <aside className="settings-sidebar" role="dialog" aria-label="Configurações">
      <header className="settings-sidebar__head">
        <h2>Configurações</h2>
        <button
          type="button"
          className="settings-sidebar__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
      </header>

      <section className="settings-sidebar__section">
        <h3>Formato das caixas</h3>
        <div className="settings-radio-group">
          {BOX_FORMAT_OPTIONS.map((option) => (
            <label key={option.value} className="settings-radio">
              <input
                type="radio"
                name="box-format"
                value={option.value}
                checked={format === option.value}
                onChange={() => onFormatChange(option.value)}
              />
              <span className="settings-radio__text">
                <strong>{option.label}</strong>
                <span className="settings-radio__hint">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>
    </aside>
  );
}
