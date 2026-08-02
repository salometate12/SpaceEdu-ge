import type { RegisterSpace } from "@/lib/auth";

export interface RegistrationState {
  space: RegisterSpace;
  step: 1 | 2 | 3;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  schoolClass?: string;
  examYear?: string;
  examSubjects: string[];
  university?: string;
  faculty?: string;
  semester?: number;
  studentSubjects: string[];
}

export const EXAM_SUBJECTS = [
  { name: "ქართული ენა და ლიტერატურა", required: true },
  { name: "მათემატიკა", required: true },
  { name: "ინგლისური ენა", required: false },
  { name: "ისტორია", required: false },
  { name: "ბიოლოგია", required: false },
  { name: "ქიმია", required: false },
  { name: "ფიზიკა", required: false },
  { name: "გეოგრაფია", required: false },
] as const;

export const SCHOOL_SUBJECTS = [
  "მათემატიკა",
  "ქართული",
  "ინგლისური",
  "ფიზიკა",
  "ქიმია",
  "ბიოლოგია",
  "ისტორია",
  "გეოგრაფია",
] as const;

