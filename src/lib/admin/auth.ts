import { ADMIN_PASSWORD, ADMIN_PASSWORD_HEADER } from "./constants";

export function verifyAdminPassword(password: string | null | undefined): boolean {
  if (!password) return false;
  return password === ADMIN_PASSWORD;
}

export function getPasswordFromRequest(request: Request): string | null {
  return request.headers.get(ADMIN_PASSWORD_HEADER);
}

export function unauthorizedResponse(message = "Unauthorized") {
  return Response.json({ error: message }, { status: 401 });
}
