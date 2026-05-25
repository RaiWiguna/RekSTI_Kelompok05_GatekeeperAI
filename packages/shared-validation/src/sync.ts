import { z } from "zod";

export const syncRunIdParamSchema = z.object({
  sync_run_id: z.string().trim().min(1).max(96),
});

export type SyncRunIdParamInput = z.infer<typeof syncRunIdParamSchema>;
