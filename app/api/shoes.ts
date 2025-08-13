// pages/api/shoes.ts
import { supabase } from '@/lib/db'

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('shoes')
    .select('*')

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json(data)
}
