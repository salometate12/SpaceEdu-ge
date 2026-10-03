import { z } from "zod";

/** What the model returns for /api/profile-goals. */
export const ProfileGoalsSchema = z.object({
  goals: z.array(
    z.object({
      text: z.string(),
      type: z.enum(["quiz", "study", "read", "chat"]),
    }),
  ),
});
