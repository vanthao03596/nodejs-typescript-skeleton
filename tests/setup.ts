import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://test:test@localhost:3306/test_db';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

beforeAll(async () => {
  console.log('Setting up test environment...');
});

afterAll(async () => {
  console.log('Cleaning up test environment...');
});