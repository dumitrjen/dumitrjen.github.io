import { createClient } from '@supabase/supabase-js'

const viteEnv = import.meta.env || {}
const supabaseUrl = viteEnv.VITE_SUPABASE_URL
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY
const keyLooksSecret = /^sb_secret_/i.test(supabaseAnonKey || '')

export const supabaseConfigError = keyLooksSecret
  ? 'Supabase secret key detected. Use the public anon key instead.'
  : ''

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !keyLooksSecret)

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
