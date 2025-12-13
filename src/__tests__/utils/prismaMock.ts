import { PrismaClient } from '@/generated/prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Create a deep mock of PrismaClient with any to bypass strict type checking in tests
export const prismaMock = mockDeep<PrismaClient>() as any;

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Mock transaction helper
export const mockTransaction = (callback: (tx: any) => any) => {
  return callback(prismaMock);
};

// Setup prisma mock to handle transactions
prismaMock.$transaction.mockImplementation(mockTransaction);
