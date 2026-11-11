// Valores PÚBLICOS do Supabase — podem ficar no código sem problema.
// NUNCA coloque aqui a secret key / service_role nem a senha do banco.
// (Se existir um arquivo .env com VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY, ele tem prioridade.)
export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://dnixjqeziggarvcfwnyb.supabase.co'

export const SUPABASE_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_eonMuuVfIk7fbgSHpGufqw_X998w96Y'
