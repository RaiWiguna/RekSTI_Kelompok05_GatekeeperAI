import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AccessResult, AttendanceSource, AttendanceStatus, UserRole, UserStatus } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type {
  GatewayAuthInput,
  GatewayEventInput,
  GatewayEventsBatchInput,
  GatewayHeartbeatInput,
  GatewayReferenceAckInput,
  GatewayReferenceQueryInput,
} from "@gatekeeper/shared-validation";
import { createHash } from "node:crypto";

import { appEnv } from "../config/app-env";
import { parseDateOnly } from "../common/date/calendar";
import {
  fromAccessResult,
  toAccessEventType,
  toAccessResult,
  toDeviceStatus,
  toLivenessResult,
} from "../common/database/prisma-enum-mappers";
import { PrismaService } from "../database/prisma.service";
import type { AuthTokenPayload } from "../auth/auth.types";

@Injectable()
export class GatewayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async auth(payload: GatewayAuthInput) {
    const gatewayUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: payload.gateway_id }, { accountName: payload.gateway_id }],
        role: UserRole.GATEWAY,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        accountName: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!gatewayUser || !(await argon2.verify(gatewayUser.passwordHash, payload.secret))) {
      throw new UnauthorizedException({
        code: "invalid_auth",
        message: "Invalid gateway credentials",
      });
    }

    const tokenPayload: AuthTokenPayload = {
      sub: gatewayUser.id,
      email: gatewayUser.email,
      account_name: gatewayUser.accountName,
      role: "gateway",
      type: "access",
    };

    return {
      access_token: await this.jwtService.signAsync(tokenPayload, {
        secret: appEnv.JWT_SECRET,
        expiresIn: "1d",
      }),
      gateway_id: payload.gateway_id,
    };
  }

  async uploadEvent(payload: GatewayEventInput) {
    const existing = await this.prisma.accessLog.findUnique({
      where: { eventId: payload.event_id },
      select: { eventId: true },
    });

    if (existing) {
      return {
        event_id: payload.event_id,
        status: "duplicate" as const,
      };
    }

    const resolved = await this.resolveEventReferences(payload);
    const accessLog = await this.prisma.accessLog.create({
      data: {
        eventId: payload.event_id,
        deviceId: resolved.device?.id,
        deviceCode: resolved.device?.deviceCode ?? payload.device_id,
        studentId: resolved.student?.id,
        studentNim: resolved.student?.nim ?? payload.student_nim,
        roomId: resolved.room?.id ?? resolved.device?.roomId,
        roomCode: resolved.room?.code ?? payload.room_code,
        scheduleId: resolved.schedule?.id,
        scheduleRef: payload.schedule_ref,
        eventType: toAccessEventType(payload.event_type),
        accessResult: toAccessResult(payload.access_result),
        livenessResult: payload.liveness_result ? toLivenessResult(payload.liveness_result) : undefined,
        confidenceScore: payload.confidence_score,
        gatewayId: payload.gateway_id,
        syncVersion: payload.sync_version,
        isSynced: true,
        eventAt: new Date(payload.event_at),
      },
    });

    if (
      accessLog.accessResult === AccessResult.GRANTED &&
      resolved.student &&
      resolved.schedule
    ) {
      await this.applyAttendanceFromAccessEvent({
        studentId: resolved.student.id,
        classId: resolved.schedule.classId,
        scheduleId: resolved.schedule.id,
        roomId: resolved.room?.id ?? resolved.device?.roomId ?? null,
        eventType: payload.event_type,
        eventAt: new Date(payload.event_at),
        occurrenceDate: parseDateOnly(payload.event_at.slice(0, 10)),
      });
    }

    return {
      event_id: accessLog.eventId,
      status: "accepted" as const,
      access_result: fromAccessResult(accessLog.accessResult),
    };
  }

  async uploadBatch(payload: GatewayEventsBatchInput) {
    let accepted = 0;
    let duplicates = 0;
    let rejected = 0;

    const results = [];
    for (const event of payload.events) {
      try {
        const result = await this.uploadEvent(event);
        if (result.status === "duplicate") {
          duplicates += 1;
        } else {
          accepted += 1;
        }
        results.push(result);
      } catch (error) {
        rejected += 1;
        results.push({
          event_id: event.event_id,
          status: "rejected" as const,
          reason: error instanceof Error ? error.message : "event_rejected",
        });
      }
    }

    return {
      batch_id: payload.batch_id,
      accepted,
      duplicates,
      rejected,
      results,
    };
  }

  async heartbeat(payload: GatewayHeartbeatInput) {
    const device = await this.resolveDevice(payload.device_id);
    if (device) {
      await this.prisma.device.update({
        where: { id: device.id },
        data: {
          status: toDeviceStatus(payload.status),
          lastSeenAt: new Date(payload.sent_at),
        },
      });
    }

    return {
      gateway_id: payload.gateway_id,
      device_id: payload.device_id,
      status: "accepted",
      queued_events: payload.queued_events,
    };
  }

  async referenceVersion(_query: GatewayReferenceQueryInput) {
    const generatedAt = new Date().toISOString();
    return {
      datasets: [
        {
          dataset_name: "room_schedule",
          dataset_version: generatedAt,
          checksum: checksum(generatedAt),
        },
      ],
    };
  }

  async referenceSnapshot(query: GatewayReferenceQueryInput) {
    const device = await this.resolveDevice(query.device_id);
    const roomId = device?.roomId;
    const schedules = await this.prisma.schedule.findMany({
      where: roomId
        ? {
            class: {
              roomId,
            },
          }
        : {},
      include: {
        class: {
          include: {
            course: true,
            room: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                student: {
                  include: {
                    faceEmbeddings: {
                      where: { status: "ACTIVE" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    const generatedAt = new Date().toISOString();

    return {
      device_id: query.device_id,
      dataset_name: "room_schedule",
      dataset_version: generatedAt,
      generated_at: generatedAt,
      checksum: checksum(JSON.stringify(schedules)),
      schedules: schedules.map((schedule) => ({
        schedule_id: schedule.id,
        day_of_week: schedule.dayOfWeek.toLowerCase(),
        start_time: schedule.startTime.toISOString(),
        end_time: schedule.endTime.toISOString(),
        start_date: schedule.startDate.toISOString().slice(0, 10),
        end_date: schedule.endDate.toISOString().slice(0, 10),
        class_id: schedule.classId,
        class_code: schedule.class.classCode,
        course: {
          id: schedule.class.course.id,
          code: schedule.class.course.code,
          name: schedule.class.course.name,
        },
        room: {
          id: schedule.class.room.id,
          code: schedule.class.room.code,
          name: schedule.class.room.name,
        },
        enrolled_students: schedule.class.enrollments.map((enrollment) => ({
          student_id: enrollment.student.id,
          nim: enrollment.student.nim,
          full_name: enrollment.student.fullName,
          face_embeddings: enrollment.student.faceEmbeddings.map((embedding) => ({
            embedding_ref: embedding.embeddingRef,
            model_version: embedding.modelVersion,
          })),
        })),
      })),
    };
  }

  async referenceAck(payload: GatewayReferenceAckInput) {
    const device = await this.resolveDevice(payload.device_id);
    if (!device) {
      return {
        device_id: payload.device_id,
        dataset_name: payload.dataset_name,
        dataset_version: payload.dataset_version,
        status: "unknown_device",
      };
    }

    await this.prisma.gatewayReferenceAck.upsert({
      where: {
        deviceId_datasetName_datasetVersion: {
          deviceId: device.id,
          datasetName: payload.dataset_name,
          datasetVersion: payload.dataset_version,
        },
      },
      create: {
        deviceId: device.id,
        datasetName: payload.dataset_name,
        datasetVersion: payload.dataset_version,
        checksum: payload.checksum,
        appliedAt: new Date(payload.applied_at),
      },
      update: {
        checksum: payload.checksum,
        appliedAt: new Date(payload.applied_at),
      },
    });

    return {
      device_id: payload.device_id,
      dataset_name: payload.dataset_name,
      dataset_version: payload.dataset_version,
      status: "acked",
    };
  }

  private async resolveEventReferences(payload: GatewayEventInput) {
    const [device, student, room, schedule] = await Promise.all([
      this.resolveDevice(payload.device_id),
      payload.student_nim
        ? this.prisma.student.findUnique({ where: { nim: payload.student_nim } })
        : Promise.resolve(null),
      payload.room_code
        ? this.prisma.room.findUnique({ where: { code: payload.room_code } })
        : Promise.resolve(null),
      payload.schedule_ref && isUuid(payload.schedule_ref)
        ? this.prisma.schedule.findUnique({ where: { id: payload.schedule_ref } })
        : Promise.resolve(null),
    ]);

    return { device, student, room, schedule };
  }

  private async resolveDevice(deviceIdOrCode: string) {
    if (isUuid(deviceIdOrCode)) {
      return this.prisma.device.findUnique({ where: { id: deviceIdOrCode } });
    }

    return this.prisma.device.findUnique({ where: { deviceCode: deviceIdOrCode } });
  }

  private async applyAttendanceFromAccessEvent(params: {
    studentId: string;
    classId: string;
    scheduleId: string;
    roomId: string | null;
    eventType: GatewayEventInput["event_type"];
    eventAt: Date;
    occurrenceDate: Date;
  }) {
    const existing = await this.prisma.attendanceRecord.findFirst({
      where: {
        studentId: params.studentId,
        scheduleId: params.scheduleId,
        occurrenceDate: params.occurrenceDate,
      },
      select: { id: true },
    });
    const isExit = params.eventType === "exit";

    if (existing) {
      await this.prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: isExit
          ? {
              status: AttendanceStatus.LEFT,
              checkOutAt: params.eventAt,
            }
          : {
              status: AttendanceStatus.PRESENT,
              checkInAt: params.eventAt,
            },
      });
      return;
    }

    await this.prisma.attendanceRecord.create({
      data: {
        studentId: params.studentId,
        classId: params.classId,
        scheduleId: params.scheduleId,
        occurrenceDate: params.occurrenceDate,
        roomId: params.roomId,
        status: isExit ? AttendanceStatus.LEFT : AttendanceStatus.PRESENT,
        source: AttendanceSource.DEVICE,
        checkInAt: isExit ? null : params.eventAt,
        checkOutAt: isExit ? params.eventAt : null,
      },
    });
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function checksum(value: string) {
  return `sha256-${createHash("sha256").update(value).digest("hex")}`;
}
