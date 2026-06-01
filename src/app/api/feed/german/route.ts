import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    completion: 65,
    streak: 12,
    todayCompleted: true
  });
}