import { z } from "zod";

import { paginationQuerySchema } from "./common";

export const notificationsListQuerySchema = paginationQuerySchema.extend({
  unread: z.coerce.boolean().optional(),
});

export type NotificationsListQueryInput = z.infer<typeof notificationsListQuerySchema>;
