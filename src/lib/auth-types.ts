// Shared, dependency-free auth types — safe to import from both client and server.

/** The user shape exposed to the UI. */
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

/** Error codes the auth API can return, surfaced to the client for localized messages. */
export type AuthErrorCode =
  | "missing_fields"
  | "weak_password"
  | "email_taken"
  | "invalid_credentials"
  | "generic";
