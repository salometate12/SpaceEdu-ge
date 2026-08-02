const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegistrationField = "name" | "email" | "password" | "terms";

export type RegistrationErrors = Partial<Record<RegistrationField, string>>;

export function validateRegistrationForm(input: {
  name: string;
  email: string;
  password: string;
  termsAccepted: boolean;
}): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const name = input.name.trim();

  if (name.length < 2) {
    errors.name = "შეიყვანე სრული სახელი (მინიმუმ 2 სიმბოლო)";
  }

  const email = input.email.trim();
  if (!email) {
    errors.email = "ელ-ფოსტა სავალდებულოა";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "ელ-ფოსტის ფორმატი არასწორია";
  }

  if (input.password.length < 6) {
    errors.password = "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო";
  }

  if (!input.termsAccepted) {
    errors.terms = "გთხოვ, დაეთანხმო წესებსა და პირობებს";
  }

  return errors;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
