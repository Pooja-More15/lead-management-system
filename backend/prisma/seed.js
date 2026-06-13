const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing records in a safe order
  await prisma.refreshToken.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.leadStatusHistory.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@example.com',
      password: passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Lead Manager',
      email: 'manager@example.com',
      password: passwordHash,
      role: 'MANAGER',
      isActive: true,
      createdBy: admin.id,
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      name: 'Sales Agent Alice',
      email: 'agent@example.com',
      password: passwordHash,
      role: 'AGENT',
      isActive: true,
      createdBy: admin.id,
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      name: 'Sales Agent Bob',
      email: 'agent2@example.com',
      password: passwordHash,
      role: 'AGENT',
      isActive: true,
      createdBy: admin.id,
    },
  });

  console.log('Seed users created:');
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Manager: ${manager.email}`);
  console.log(`- Agent Alice: ${agent1.email}`);
  console.log(`- Agent Bob: ${agent2.email}`);

  // Create dummy leads
  const lead1 = await prisma.lead.create({
    data: {
      name: 'John Doe',
      email: 'johndoe@example.com',
      phone: '+1234567890',
      source: 'Website',
      status: 'NEW',
      priority: 'HIGH',
      notes: 'Interested in enterprise pricing package.',
      assignedTo: agent1.id,
      createdBy: manager.id,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Jane Smith',
      email: 'janesmith@example.com',
      phone: '+1987654321',
      source: 'LinkedIn',
      status: 'CONTACTED',
      priority: 'MEDIUM',
      notes: 'Spoke briefly. Wants product demo next Tuesday.',
      assignedTo: agent2.id,
      createdBy: manager.id,
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      name: 'Acme Corp',
      email: 'info@acme.com',
      phone: '+1122334455',
      source: 'Cold Call',
      status: 'QUALIFIED',
      priority: 'URGENT',
      notes: 'Decision maker is interested in API integration capability.',
      assignedTo: agent1.id,
      createdBy: manager.id,
    },
  });

  console.log('Seed leads created successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
