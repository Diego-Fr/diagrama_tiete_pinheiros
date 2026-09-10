/**
 * Base dos endpoints SIBH.
 *
 * Em produção a aplicação é servida pelo mesmo host da API
 * (`apps.spaguas.sp.gov.br/sibh/...`), então caminho relativo resolve
 * same-origin. Em desenvolvimento o proxy do Vite (`vite.config.ts`)
 * encaminha `/sibh` para o host real — necessário porque
 * `/sibh/api/v1/parameters` não devolve cabeçalho CORS.
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "/sibh/api";
