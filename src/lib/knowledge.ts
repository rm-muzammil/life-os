function calculateKnowledge(tasks: any[]) {
  if (!tasks.length) return 0;

  const done = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;

  const baseCompletion = (done / total) * 100;

  // optional weighting (MERN, ML, German = learning intensity)
  const weightedBoost =
    tasks.reduce((sum, t) => {
      if (t.track === "ML") return sum + 1.2;
      if (t.track === "MERN") return sum + 1.1;
      if (t.track === "German") return sum + 1.0;
      return sum;
    }, 0) / tasks.length;

  return Math.min(100, baseCompletion * weightedBoost);
}
export { calculateKnowledge };