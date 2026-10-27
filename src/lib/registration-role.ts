import type { RegisterSpace } from "@/lib/auth";

export type RegistrationRoleParam = "abiturient" | "student";

export function parseRegistrationRole(
  value: string | null,
): RegistrationRoleParam | null {
  if (value === "abiturient" || value === "student") {
    return value;
  }
  return null;
}

export function roleToRegisterSpace(role: RegistrationRoleParam): RegisterSpace {
  return role;
}

/** The line under „შექმენი ანგარიში“ for each space. */
export function registrationRoleSubtext(role: RegistrationRoleParam): string {
  if (role === "abiturient") {
    return "ეროვნული გამოცდებისთვის მზადება აქედან იწყება";
  }
  return "უნივერსიტეტის სწავლა ერთ სივრცეში";
}

export function registrationHref(role: RegistrationRoleParam): string {
  return `/registration?role=${role}`;
}
