import "dotenv/config";

import argon2 from "argon2";
import { PrismaClient, UserRole, UserStatus, LecturerStatus } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@gatekeeper.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!";
const lecturerEmail = process.env.SEED_LECTURER_EMAIL ?? "lecturer@gatekeeper.local";
const lecturerPassword = process.env.SEED_LECTURER_PASSWORD ?? "Lecturer12345!";

async function main() {
  const [adminPasswordHash, lecturerPasswordHash] = await Promise.all([
    argon2.hash(adminPassword),
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

  console.log("Seed completed");
  console.log(`Admin: ${adminUser.email} / ${adminPassword}`);
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
