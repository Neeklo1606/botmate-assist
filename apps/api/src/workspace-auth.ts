import type { AuthContext } from "./auth.js";

/** Cookie session, bearer JWT, or short-lived WS ticket — API keys cannot access workspace CRUD routes. */
export function requireWorkspaceAuth(auth: AuthContext): boolean {
  return auth.authType === "session" || auth.authType === "jwt" || auth.authType === "wsTicket";
}
