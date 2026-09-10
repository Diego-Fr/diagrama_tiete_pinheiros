import { useEffect, useState } from "react";
import type { GroupType } from "@/api/measurements";

const GROUP_OPTIONS: { value: GroupType; label: string }[] = [
  { value: "minute", label: "Minuto" },
  { value: "hour", label: "Hora" },
  { value: "day", label: "Dia" },
  { value: "month", label: "Mês" },
];

interface DateRangeControlProps {
  start: Date;
  end: Date;
  groupType: GroupType;
  onApply: (start: Date, end: Date, groupType: GroupType) => void;
}

function toInputValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}

/** Seletor de intervalo (início / fim) + agrupamento, com botão Aplicar. */
export default function DateRangeControl({
  start,
  end,
  groupType,
  onApply,
}: DateRangeControlProps) {
  const [s, setS] = useState(() => toInputValue(start));
  const [e, setE] = useState(() => toInputValue(end));
  const [group, setGroup] = useState<GroupType>(groupType);

  useEffect(() => {
    setS(toInputValue(start));
    setE(toInputValue(end));
    setGroup(groupType);
  }, [start, end, groupType]);

  const sd = new Date(s);
  const ed = new Date(e);
  const valid =
    !Number.isNaN(sd.getTime()) &&
    !Number.isNaN(ed.getTime()) &&
    sd.getTime() < ed.getTime();

  return (
    <div className="date-range">
      <label className="date-range__field">
        <span>Início</span>
        <input
          type="datetime-local"
          value={s}
          max={e}
          onChange={(ev) => setS(ev.target.value)}
        />
      </label>
      <label className="date-range__field">
        <span>Fim</span>
        <input
          type="datetime-local"
          value={e}
          min={s}
          onChange={(ev) => setE(ev.target.value)}
        />
      </label>
      <label className="date-range__field">
        <span>Agrupar</span>
        <select
          value={group}
          onChange={(ev) => setGroup(ev.target.value as GroupType)}
        >
          {GROUP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="date-range__apply"
        disabled={!valid}
        onClick={() => valid && onApply(sd, ed, group)}
      >
        Aplicar
      </button>
    </div>
  );
}
