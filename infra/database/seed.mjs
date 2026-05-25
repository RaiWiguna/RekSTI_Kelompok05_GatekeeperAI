import "dotenv/config";

import argon2 from "argon2";
import {
  AttendanceSource,
  AttendanceStatus,
  CourseStatus,
  DayOfWeek,
  DeviceStatus,
  EnrollmentStatus,
  LecturerStatus,
  PrismaClient,
  ScheduleSource,
  StudentStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@gatekeeper.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!";
const studentEmail = process.env.SEED_STUDENT_EMAIL ?? "student@gatekeeper.local";
const studentPassword = process.env.SEED_STUDENT_PASSWORD ?? "Student12345!";
const lecturerEmail = process.env.SEED_LECTURER_EMAIL ?? "lecturer@gatekeeper.local";
const lecturerPassword = process.env.SEED_LECTURER_PASSWORD ?? "Lecturer12345!";
const gatewayEmail = process.env.SEED_GATEWAY_ID ?? "gw-01";
const gatewayPassword = process.env.SEED_GATEWAY_SECRET ?? "Gateway12345!";

async function main() {
  const [adminPasswordHash, studentPasswordHash, lecturerPasswordHash, gatewayPasswordHash] = await Promise.all([
    argon2.hash(adminPassword),
    argon2.hash(studentPassword),
    argon2.hash(lecturerPassword),
    argon2.hash(gatewayPassword),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      accountName: "Gatekeeper Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: adminEmail,
      accountName: "Gatekeeper Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: adminPasswordHash,
    },
  });

  const lecturerUser = await prisma.user.upsert({
    where: { email: lecturerEmail },
    update: {
      accountName: "Ir. Budi Rahardjo",
      role: UserRole.LECTURER,
      status: UserStatus.ACTIVE,
      passwordHash: lecturerPasswordHash,
    },
    create: {
      email: lecturerEmail,
      accountName: "Ir. Budi Rahardjo",
      role: UserRole.LECTURER,
      status: UserStatus.ACTIVE,
      passwordHash: lecturerPasswordHash,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      accountName: "Gatekeeper Student",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: studentPasswordHash,
    },
    create: {
      email: studentEmail,
      accountName: "Gatekeeper Student",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: studentPasswordHash,
    },
  });

  const gatewayUser = await prisma.user.upsert({
    where: { email: gatewayEmail },
    update: {
      accountName: "gw-01",
      role: UserRole.GATEWAY,
      status: UserStatus.ACTIVE,
      passwordHash: gatewayPasswordHash,
    },
    create: {
      email: gatewayEmail,
      accountName: "gw-01",
      role: UserRole.GATEWAY,
      status: UserStatus.ACTIVE,
      passwordHash: gatewayPasswordHash,
    },
  });

  const primaryLecturer = await prisma.lecturer.upsert({
    where: { nidn: "100200300" },
    update: {
      fullName: "Ir. Budi Rahardjo, M.Sc., Ph.D.",
      status: LecturerStatus.ACTIVE,
      userId: lecturerUser.id,
    },
    create: {
      nidn: "100200300",
      fullName: "Ir. Budi Rahardjo, M.Sc., Ph.D.",
      status: LecturerStatus.ACTIVE,
      userId: lecturerUser.id,
    },
  });

  const student = await prisma.student.upsert({
    where: { nim: "220123456" },
    update: {
      fullName: "Gatekeeper Student",
      status: StudentStatus.ACTIVE,
      userId: studentUser.id,
    },
    create: {
      nim: "220123456",
      fullName: "Gatekeeper Student",
      status: StudentStatus.ACTIVE,
      userId: studentUser.id,
    },
  });

  const lecturers = await seedLecturers(primaryLecturer.id);
  const room = await prisma.room.upsert({
    where: { code: "R-STI-01" },
    update: {
      name: "Ruang STI 01",
      building: "Labtek",
      floor: 2,
    },
    create: {
      code: "R-STI-01",
      name: "Ruang STI 01",
      building: "Labtek",
      floor: 2,
    },
  });
  await prisma.device.upsert({
    where: { deviceCode: "DEV-R-STI-01" },
    update: {
      roomId: room.id,
      deviceType: "serial-door-controller",
      status: DeviceStatus.OFFLINE,
    },
    create: {
      roomId: room.id,
      deviceCode: "DEV-R-STI-01",
      deviceType: "serial-door-controller",
      status: DeviceStatus.OFFLINE,
    },
  });

  const courses = await seedCourses();
  const schedulesByCourseCode = await seedClassesAndSchedules({
    courses,
    lecturers,
    roomId: room.id,
  });

  for (const classSchedule of Object.values(schedulesByCourseCode)) {
    await prisma.enrollment.upsert({
      where: {
        studentId_classId: {
          studentId: student.id,
          classId: classSchedule.classId,
        },
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
      },
      create: {
        studentId: student.id,
        classId: classSchedule.classId,
        status: EnrollmentStatus.ACTIVE,
      },
    });
  }

  await seedAttendanceHistory({
    studentId: student.id,
    roomId: room.id,
    schedulesByCourseCode,
  });

  console.log("Seed completed");
  console.log(`Admin: ${adminUser.email} / ${adminPassword}`);
  console.log(`Student: ${studentUser.email} / ${studentPassword}`);
  console.log(`Lecturer: ${lecturerUser.email} / ${lecturerPassword}`);
  console.log(`Gateway: ${gatewayUser.email} / ${gatewayPassword}`);
}

async function seedLecturers(primaryLecturerId) {
  const lecturerData = [
    ["100200300", "Ir. Budi Rahardjo, M.Sc., Ph.D.", primaryLecturerId],
    ["100200301", "Ir. Budi Rahardjo, M.Sc., Ph.D."],
    ["100200302", "Dr. Ir. Arry Akhmad Arman, M.T."],
    ["100200303", "Prof. Dr. Ing. Ir. Suhardi, M.T."],
    ["100200304", "Muhamad Koyimatu, S.Si., M.Si., M.Sc., Ph.D."],
    ["100200305", "Prof. Ir. Kridanto Surendro, M.Sc., Ph.D."],
    ["100200306", "Ir. Windy Gambetta, M.B.A."],
  ];
  const result = new Map();

  for (const [nidn, fullName, existingId] of lecturerData) {
    const lecturer = existingId
      ? await prisma.lecturer.update({
          where: { id: existingId },
          data: { fullName, status: LecturerStatus.ACTIVE },
        })
      : await prisma.lecturer.upsert({
          where: { nidn },
          update: { fullName, status: LecturerStatus.ACTIVE },
          create: { nidn, fullName, status: LecturerStatus.ACTIVE },
        });
    result.set(fullName, lecturer);
  }

  return result;
}

async function seedCourses() {
  const courseData = [
    ["II3230", "Keamanan Informasi", 3],
    ["WI2022", "Manajemen Proyek", 3],
    ["II3240", "Rekayasa Sistem TI", 3],
    ["IF3211", "Komputasi Domain Spesifik", 3],
    ["II3220", "Tata Kelola TI", 3],
    ["II4012", "AI for Business", 3],
  ];
  const result = new Map();

  for (const [code, name, credits] of courseData) {
    const course = await prisma.course.upsert({
      where: { code },
      update: { name, credits, status: CourseStatus.ACTIVE },
      create: { code, name, credits, status: CourseStatus.ACTIVE },
    });
    result.set(code, course);
  }

  return result;
}

async function seedClassesAndSchedules({ courses, lecturers, roomId }) {
  const period = {
    startDate: dateOnly("2026-02-01"),
    endDate: dateOnly("2026-06-30"),
  };
  const classData = [
    ["II3220", "II3220-01", "Prof. Ir. Kridanto Surendro, M.Sc., Ph.D.", DayOfWeek.MONDAY, "07:00:00", "08:40:00"],
    ["WI2022", "WI2022-01", "Dr. Ir. Arry Akhmad Arman, M.T.", DayOfWeek.MONDAY, "09:00:00", "10:40:00"],
    ["II3230", "II3230-01", "Ir. Budi Rahardjo, M.Sc., Ph.D.", DayOfWeek.MONDAY, "11:00:00", "12:40:00"],
    ["II3240", "II3240-01", "Prof. Dr. Ing. Ir. Suhardi, M.T.", DayOfWeek.MONDAY, "13:00:00", "14:40:00"],
    ["IF3211", "IF3211-01", "Muhamad Koyimatu, S.Si., M.Si., M.Sc., Ph.D.", DayOfWeek.WEDNESDAY, "08:00:00", "09:40:00"],
    ["II4012", "II4012-01", "Ir. Windy Gambetta, M.B.A.", DayOfWeek.FRIDAY, "10:00:00", "11:40:00"],
  ];
  const result = {};

  for (const [courseCode, classCode, lecturerName, dayOfWeek, startTime, endTime] of classData) {
    const course = courses.get(courseCode);
    const lecturer = lecturers.get(lecturerName) ?? lecturers.get("Ir. Budi Rahardjo, M.Sc., Ph.D.");
    const classItem = await prisma.class.upsert({
      where: {
        classCode_semester_academicYear: {
          classCode,
          semester: "6",
          academicYear: "2025/2026",
        },
      },
      update: {
        courseId: course.id,
        lecturerId: lecturer.id,
        roomId,
      },
      create: {
        courseId: course.id,
        lecturerId: lecturer.id,
        roomId,
        classCode,
        semester: "6",
        academicYear: "2025/2026",
      },
    });
    const schedule = await prisma.schedule.upsert({
      where: {
        classId_dayOfWeek_startDate_endDate_startTime_endTime: {
          classId: classItem.id,
          dayOfWeek,
          startDate: period.startDate,
          endDate: period.endDate,
          startTime: timeOnly(startTime),
          endTime: timeOnly(endTime),
        },
      },
      update: {
        source: ScheduleSource.MANUAL,
      },
      create: {
        classId: classItem.id,
        dayOfWeek,
        startDate: period.startDate,
        endDate: period.endDate,
        startTime: timeOnly(startTime),
        endTime: timeOnly(endTime),
        source: ScheduleSource.MANUAL,
      },
    });

    result[courseCode] = {
      classId: classItem.id,
      scheduleId: schedule.id,
    };
  }

  return result;
}

async function seedAttendanceHistory({ studentId, roomId, schedulesByCourseCode }) {
  const history = [
    ["II3230", "2026-02-09", AttendanceStatus.PRESENT],
    ["II3230", "2026-02-16", AttendanceStatus.PRESENT],
    ["II3230", "2026-02-23", AttendanceStatus.ALPHA],
    ["II3230", "2026-03-02", AttendanceStatus.PRESENT],
    ["II3220", "2026-05-25", AttendanceStatus.PRESENT],
    ["WI2022", "2026-05-25", AttendanceStatus.ALPHA],
  ];

  for (const [courseCode, date, status] of history) {
    const item = schedulesByCourseCode[courseCode];
    if (!item) {
      continue;
    }
    await prisma.attendanceRecord.upsert({
      where: {
        studentId_scheduleId_occurrenceDate: {
          studentId,
          scheduleId: item.scheduleId,
          occurrenceDate: dateOnly(date),
        },
      },
      update: {
        status,
        source: AttendanceSource.MANUAL,
        checkInAt: status === AttendanceStatus.PRESENT ? dateTime(date, "08:00:00") : null,
        checkOutAt: null,
      },
      create: {
        studentId,
        classId: item.classId,
        scheduleId: item.scheduleId,
        occurrenceDate: dateOnly(date),
        roomId,
        status,
        source: AttendanceSource.MANUAL,
        checkInAt: status === AttendanceStatus.PRESENT ? dateTime(date, "08:00:00") : null,
        checkOutAt: null,
      },
    });
  }
}

function dateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function timeOnly(value) {
  return new Date(`1970-01-01T${value}.000Z`);
}

function dateTime(date, time) {
  return new Date(`${date}T${time}+07:00`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
