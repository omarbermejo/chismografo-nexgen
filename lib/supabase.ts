import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const g = globalThis as unknown as { _supabase?: SupabaseClient }

g._supabase ??= createClient(
  'https://azmskaqdvbyckhgcjhqm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXNrYXFkdmJ5Y2toZ2NqaHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjU2MzAsImV4cCI6MjA5NzMwMTYzMH0.9d4-w3w3OXpVxUN_GKf5GSkva93qiGyTRxS-20MR3kU',
  { realtime: { params: { eventsPerSecond: 10 } } }
)

export const supabase = g._supabase
