import { Award, BrainCircuit, CalendarCheck, Flame, GraduationCap, Layers, Medal, Target, type LucideIcon } from "lucide-react";
import type { ActivityEvent, StatsSpace } from "@/lib/activity-log";
import type { Badge } from "@/lib/badges";
import { bestStreak, inSpace } from "./common";

interface BadgeRule {
  id: string;
  icon: LucideIcon;
  color: Badge["color"];
  name: string;
  requirement: string;
  earned: (events: ActivityEvent[], context: { streakBest: number; subjects: string[] }) => boolean;
}

const quizRuns = (events: ActivityEvent[]) => events.filter((event) => event.type === "quiz_completed");

const RULES: BadgeRule[] = [
  { id: "streak_7", icon: Flame, color: "amber", name: "7 დღის სტრიქი", requirement: "7 დღე ზედიზედ", earned: (_, c) => c.streakBest >= 7 },
  {
    id: "quiz_master",
    icon: BrainCircuit,
    color: "cyan",
    name: "ქვიზის ოსტატი",
    requirement: "10 ქვიზი, საშუალოდ 80%+",
    earned: (events) => {
      const runs = quizRuns(events).filter((event) => event.value !== null);
      return runs.length >= 10 && runs.reduce((sum, event) => sum + (event.value as number), 0) / runs.length >= 80;
    },
  },
  {
    id: "first_plan",
    icon: CalendarCheck,
    color: "green",
    name: "პირველი გეგმა",
    requirement: "მონიშნე გეგმის ერთი დღე",
    earned: (events) => events.some((event) => event.type === "plan_day_done"),
  },
  { id: "sessions_50", icon: Award, color: "purple", name: "50 სესია", requirement: "50 აქტივობა", earned: (events) => events.length >= 50 },
  { id: "streak_30", icon: Medal, color: "amber", name: "30 დღის სტრიქი", requirement: "30 დღე ზედიზედ", earned: (_, c) => c.streakBest >= 30 },
  {
    id: "quiz_100",
    icon: Target,
    color: "purple",
    name: "100% ქვიზში",
    requirement: "ერთ ქვიზში ყველა პასუხი სწორი",
    earned: (events) => quizRuns(events).some((event) => event.value === 100),
  },
  {
    id: "all_subjects",
    icon: Layers,
    color: "green",
    name: "ყველა საგანი",
    requirement: "აქტივობა ყველა საგანში",
    earned: (events, c) =>
      c.subjects.length > 0 && c.subjects.every((name) => events.some((event) => event.subject === name)),
  },
  {
    id: "mock_exam",
    icon: GraduationCap,
    color: "cyan",
    name: "საცდელი გამოცდა",
    requirement: "გაიარე ერთი სიმულაცია",
    earned: (events) => events.some((event) => event.type === "mock_exam_completed"),
  },
];

/**
 * The eight badges, earned from the activity log of one space. The streak
 * counts the longer of the header's streak and the log's own.
 */
export function computeBadges(
  log: ActivityEvent[],
  space: StatsSpace,
  { streakBest = 0, subjects = [] }: { streakBest?: number; subjects?: string[] } = {},
): Badge[] {
  const events = inSpace(log, space);
  const context = { streakBest: Math.max(streakBest, bestStreak(events)), subjects };
  return RULES.map((rule) => ({
    id: rule.id,
    icon: rule.icon,
    color: rule.color,
    name: rule.name,
    requirement: rule.requirement,
    unlocked: rule.earned(events, context),
  }));
}
