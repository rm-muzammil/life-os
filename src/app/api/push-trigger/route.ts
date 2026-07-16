import { NextResponse } from 'next/server'
import { pushToSelfKhilafah } from '@/lib/push'

export async function POST() {
  await pushToSelfKhilafah()
  return NextResponse.json({ ok: true })
}