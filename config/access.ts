/**
 * Route-level access policy only. Never place usernames, passwords or password
 * hashes in a static frontend bundle because visitors can download that data.
 * Switch `mode` to `server` only after a server-side authentication layer exists.
 */
export const accessPolicy = {
  mode: "public" as "public" | "server",
  protectedRoutes: [] as string[],
  roles: ["owner", "member"] as const,
};
