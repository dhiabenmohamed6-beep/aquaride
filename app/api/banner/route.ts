import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DEFAULT_BANNER } from '@/lib/banner'

export async function GET() {
  const { data, error } = await supabase.from('banner').select('*').eq('id', 1).single()
  
  if (error) {
    // Seed default if not exists
    const { data: seedData } = await supabase.from('banner').upsert(DEFAULT_BANNER).select().single()
    return NextResponse.json(seedData || DEFAULT_BANNER)
  }
  
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const banner = await req.json()
  
  const { data, error } = await supabase
    .from('banner')
    .upsert(banner)
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}