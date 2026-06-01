import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { calculateKnowledge } from "@/lib/knowledge";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const todayTasks = tasks.filter(t => t.due_date === today);

  const doneToday = todayTasks.filter(t => t.status === "done").length;
  const totalToday = todayTasks.length;

  const completion =
    totalToday === 0 ? 0 : (doneToday / totalToday) * 100;

  const knowledge = calculateKnowledge(tasks);

  const streak = tasks.filter(t => t.status === "done").length;

  return NextResponse.json({
    knowledge: {
      score: Math.round(knowledge),
      completion: Math.round(completion),
      streak,
      todayCompleted: completion === 100
    }
  });
}