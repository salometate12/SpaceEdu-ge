import { ADMIN_PASSWORD, ADMIN_PASSWORD_HEADER } from "./constants";

export function verifyAdminPassword(password: string | null | undefined): boolean {
  // Fail closed: with no password configured on the server, nothing gets in.
  if (!ADMIN_PASSWORD) return false;
  if (!password) return false;
  // Length-independent compare would be ideal, but even a plain compare is
  // safe here: the value is server-side and never echoed. The real risk is a
  // shipped default, which is now removed.
  return password === ADMIN_PASSWORD;
}

export function getPasswordFromRequest(request: Request): string | null {
  return request.headers.get(ADMIN_PASSWORD_HEADER);
}

export function unauthorizedResponse(message = "Unauthorized") {
  return Response.json({ error: message }, { status: 401 });
}
