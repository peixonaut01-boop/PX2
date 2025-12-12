import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Profile {
  id: string
  email: string
  full_name: string | null
  company: string | null
  phone: string | null
  tier: 'free' | 'basico' | 'avancado' | 'ultra'
  approved: boolean
  downloads_today: number
  last_download_date: string | null
  created_at: string
  updated_at: string
}

export interface Download {
  id: string
  user_id: string
  file_name: string
  file_category: string
  downloaded_at: string
}

// Tier limits
export const TIER_LIMITS = {
  free: 2,        // 2 downloads per day
  basico: 999,    // unlimited
  avancado: 999,  // unlimited
  ultra: 999,     // unlimited
}

// Tier prices (for display)
export const TIER_PRICES = {
  free: 'Grátis',
  basico: 'R$ 200/mês',
  avancado: 'R$ 1.000/mês',
  ultra: 'Sob consulta',
}

// Tier descriptions
export const TIER_DESCRIPTIONS = {
  free: '2 downloads por dia',
  basico: 'Acesso completo às ferramentas do site',
  avancado: 'Planilhas + indicadores por email e WhatsApp',
  ultra: 'Produtos personalizados sob demanda',
}

