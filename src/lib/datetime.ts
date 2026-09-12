/**
 * A API do SIBH devolve datas em UTC (string "YYYY/MM/DD HH:mm", sem
 * indicação de fuso). Este módulo centraliza o parse (como UTC) e a exibição
 * (sempre em horário de Brasília, independente do fuso do navegador).
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";

/** Interpreta "YYYY/MM/DD HH:mm" (ou "YYYY/MM/DD") da API como UTC. */
export function parseApiUtcDate(value: string): Date {
  const [datePart = "", timePart = "00:00"] = value.split(" ");
  const [y, m, d] = datePart.split("/").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0));
}

/** "14:32" em horário de Brasília. */
export function formatTimeBR(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "10/09 14:32" em horário de Brasília. */
export function formatDateTimeBR(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "10/09/2026 14:32" em horário de Brasília. */
export function formatFullDateTimeBR(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * "2026-09-11_1432" (horário de Brasília) — sem barras/dois-pontos, seguro
 * pra nome de arquivo (usado no download do print do mapa).
 */
export function formatFileStampBR(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}_${get("hour")}${get("minute")}`;
}
