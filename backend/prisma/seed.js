import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      { name: "Alice", email: "alice@gmail.com" },
      { name: "Bob", email: "bob@gmail.com" },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())