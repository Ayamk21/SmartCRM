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
    update: {},
    create: {
      id: "seed-tenant-demo",
      name: "Agence Demo",
      currency: "EUR",
      plan: "FREE",
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

  console.log("Seed termine : tenant + utilisateur admin@demo.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
