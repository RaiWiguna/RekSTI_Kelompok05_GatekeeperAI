import "dotenv/config";

import argon2 from "argon2";
import { PrismaClient, LecturerStatus, StudentStatus, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@gatekeeper.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!";
const studentEmail = process.env.SEED_STUDENT_EMAIL ?? "student@gatekeeper.local";
const studentPassword = process.env.SEED_STUDENT_PASSWORD ?? "Student12345!";
const lecturerEmail = process.env.SEED_LECTURER_EMAIL ?? "lecturer@gatekeeper.local";
const lecturerPassword = process.env.SEED_LECTURER_PASSWORD ?? "Lecturer12345!";

async function main() {
  const [adminPasswordHash, studentPasswordHash, lecturerPasswordHash] = await Promise.all([
    argon2.hash(adminPassword),
    argon2.hash(studentPassword),
    argon2.hash(lecturerPassword),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Gatekeeper Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: adminEmail,
      name: "Gatekeeper Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: adminPasswordHash,
    },
  });

  const lecturerUser = await prisma.user.upsert({
    where: { email: lecturerEmail },
    update: {
      name: "Gatekeeper Lecturer",
      role: UserRole.LECTURER,
      status: UserStatus.ACTIVE,
      passwordHash: lecturerPasswordHash,
    },
    create: {
      email: lecturerEmail,
      name: "Gatekeeper Lecturer",
      role: UserRole.LECTURER,
      status: UserStatus.ACTIVE,
      passwordHash: lecturerPasswordHash,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      name: "Gatekeeper Student",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: studentPasswordHash,
    },
    create: {
      email: studentEmail,
      name: "Gatekeeper Student",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: studentPasswordHash,
    },
  });

  await prisma.lecturer.upsert({
    where: { nidn: "100200300" },
    update: {
      name: "Gatekeeper Lecturer",
      status: LecturerStatus.ACTIVE,
      userId: lecturerUser.id,
    },
    create: {
      nidn: "100200300",
      name: "Gatekeeper Lecturer",
      status: LecturerStatus.ACTIVE,
      userId: lecturerUser.id,
    },
  });

  await prisma.student.upsert({
    where: { nim: "220123456" },
    update: {
      name: "Gatekeeper Student",
      status: StudentStatus.ACTIVE,
      userId: studentUser.id,
    },
    create: {
      nim: "220123456",
      name: "Gatekeeper Student",
      status: StudentStatus.ACTIVE,
      userId: studentUser.id,
    },
  });

  console.log("Seed completed");
  console.log(`Admin: ${adminUser.email} / ${adminPassword}`);
  console.log(`Student: ${studentUser.email} / ${studentPassword}`);
  console.log(`Lecturer: ${lecturerUser.email} / ${lecturerPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
