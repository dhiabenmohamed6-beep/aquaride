import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DEFAULT_SERVICES } from '@/lib/services'

export async function GET() {
  const { data, error } = await supabase.from('services').select('*')
  
  if (error && error.code === 'PGRST116') {
    // No rows found, seed with defaults
    const { data: seedData, error: seedError } = await supabase
      .from('services')
      .upsert(DEFAULT_SERVICES.map(s => ({ ...s, id: s.id })))
      .select()
    return NextResponse.json(seedData || DEFAULT_SERVICES)
  }
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || DEFAULT_SERVICES)
}

export async function PUT(req: NextRequest) {
  const services = await req.json()
  
  const { data, error } = await supabase
    .from('services')
    .upsert(services)
    .select()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}