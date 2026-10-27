import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

/**
 * Seed Database with initial Admin and User test accounts
 */
export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing test accounts...');
    // We clear or verify
    await User.deleteMany();

    const usersToSeed = [
      {
        name: 'Super Administrator',
        email: 'admin@example.com',
        password: 'AdminPassword@123',
        role: 'admin'
      },
      {
        name: 'Standard User',
        email: 'user@example.com',
        password: 'UserPassword@123',
        role: 'user'
      },
      {
        name: 'Alice Placement Student',
        email: 'alice@example.com',
        password: 'StudentPassword@123',
        role: 'user'
      }
    ];

    console.log('[Seed] Creating seed user accounts...');
    for (const userData of usersToSeed) {
      const created = await User.create(userData);
      console.log(`  -> Created [${created.role.toUpperCase()}] user: ${created.email} (${created.name})`);
    }

    console.log('[Seed] Seeding completed successfully!');
    console.log('\n--- Test Credentials ---');
    console.log('1. Admin: admin@example.com / AdminPassword@123  (Role: admin -> Has full admin access)');
    console.log('2. User:  user@example.com  / UserPassword@123   (Role: user  -> Blocked from admin routes with 403)');
    console.log('------------------------\n');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error.message);
  } finally {
    await disconnectDB();
  }
};

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
