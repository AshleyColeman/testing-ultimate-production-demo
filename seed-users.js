#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Seeding users...');

  try {
    // Clear existing users
    await prisma.user.deleteMany();
    console.log('🗑️ Cleared existing users');

    // Create test users
    const users = [
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        isActive: true,
      },
      {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        isActive: true,
      },
      {
        email: 'bob.wilson@example.com',
        name: 'Bob Wilson',
        isActive: false,
      },
      {
        email: 'alice.johnson@example.com',
        name: 'Alice Johnson',
        isActive: true,
      },
      {
        email: 'charlie.brown@example.com',
        name: 'Charlie Brown',
        isActive: true,
      }
    ];

    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData
      });
      console.log(`✅ Created user: ${user.name} (ID: ${user.id})`);
    }

    console.log(`\n🎉 Successfully created ${users.length} users!`);

    // Show all users
    const allUsers = await prisma.user.findMany();
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();