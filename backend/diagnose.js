const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, isActive: true }
  });
  console.log("USERS:", users);
  const leads = await prisma.lead.count();
  console.log("LEADS COUNT:", leads);
}
run().catch(console.error).finally(() => prisma.$disconnect());
