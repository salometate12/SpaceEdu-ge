import {
  DASHBOARD_ABIT_HREF,
  DASHBOARD_SCHOOL_HREF,
  DASHBOARD_STUDENT_HREF,
} from "@/lib/dashboard-routes";

export type SpaceeduSpace = "school" | "abiturient" | "student";

export function readSpaceeduSpace(): SpaceeduSpace | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem("spaceedu_space");
  if (value === "school" || value === "abiturient" || value === "student") {
    return value;
  }
  return null;
}

export function getSpaceBackTarget(input: {
  from: string | null;
  space: SpaceeduSpace | null;
}): { href: string; label: string } {
  if (input.from === "georgian") {
    return {
      href: "/subject/georgian",
      label: "საგნის სფეისზე დაბრუნება",
    };
  }

  if (input.from === "abit") {
    return {
      href: DASHBOARD_ABIT_HREF,
      label: "აბიტურიენტის სივრცეზე დაბრუნება",
    };
  }

  if (input.from === "student") {
    return {
      href: DASHBOARD_STUDENT_HREF,
      label: "დეშბორდზე დაბრუნება",
    };
  }

  switch (input.space) {
    case "student":
      return { href: DASHBOARD_STUDENT_HREF, label: "დეშბორდზე დაბრუნება" };
    case "school":
      return { href: DASHBOARD_SCHOOL_HREF, label: "დეშბორდზე დაბრუნება" };
    case "abiturient":
      return {
        href: DASHBOARD_ABIT_HREF,
        label: "აბიტურიენტის სივრცეზე დაბრუნება",
      };
    default:
      return { href: DASHBOARD_ABIT_HREF, label: "დეშბორდზე დაბრუნება" };
  }
}

export function quizHrefForGeorgianSubject(): string {
  return "/quiz?from=georgian";
}

export function researchPlatformHref(portal: "abit" | "student"): string {
  return `/research-platform?from=${portal}`;
}
