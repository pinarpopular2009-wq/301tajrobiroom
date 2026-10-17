import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://itnpuiynmfxtdrfnnttl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnB1aXlubWZ4dGRyZm5udHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMjMwOTgsImV4cCI6MjEwNzc5OTA5OH0.YIusZOV0rNHYGW0Cep2ln_0c7KWF1RAjxKrAnCzAsKU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
