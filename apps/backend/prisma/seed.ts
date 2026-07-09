import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const tenant = await prisma.tenant.upsert({
    where: { id: "seed-tenant-demo" },
    update: { status: "ACTIVE" },
    create: {
      id: "seed-tenant-demo",
      name: "Agence Demo",
      currency: "EUR",
      plan: "FREE",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      password: passwordHash,
      firstName: "Admin",
      lastName: "Demo",
      role: "ADMIN",
      tenantId: tenant.id,
    },
  });

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.platformAdmin.upsert({
    where: { email: "admin@smart.tn" },
    update: {},
    create: {
      email: "admin@smart.tn",
      password: adminPasswordHash,
    },
  });

  console.log("Seed termine : tenant + utilisateur admin@demo.com / password123");
  console.log("Seed termine : admin plateforme admin@smart.tn / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
