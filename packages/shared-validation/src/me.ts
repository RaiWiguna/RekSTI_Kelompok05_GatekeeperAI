import { z } from "zod";

export const todayViewQuerySchema = z.object({
  date: z.string().date().optional(),
});

export type TodayViewQueryInput = z.infer<typeof todayViewQuerySchema>;
