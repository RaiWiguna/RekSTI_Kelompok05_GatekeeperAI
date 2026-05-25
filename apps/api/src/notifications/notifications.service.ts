import { Injectable } from "@nestjs/common";
import type { NotificationsListQueryInput } from "@gatekeeper/shared-validation";

import type { AuthUser } from "../common/auth/auth-user.interface";
import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound } from "../common/database/query-helpers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser, query: NotificationsListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      userId: user.userId,
      ...(query.unread ? { readAt: null } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: items.map(mapNotification),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async markAsRead(user: AuthUser, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });
    assertFound(notification, "Notification");

    try {
      const updated = await this.prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });

      return mapNotification(updated);
    } catch (error) {
      mapPrismaError(error, "Notification");
    }
  }
}

function mapNotification(notification: {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    user_id: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read_at: notification.readAt?.toISOString() ?? null,
    created_at: notification.createdAt.toISOString(),
  };
}
