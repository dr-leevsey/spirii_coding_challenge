import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserAggregationService } from './user-aggregation.service';
import { UserAggregate } from '../entities';

describe('UserAggregationService', () => {
  let service: UserAggregationService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserAggregate: UserAggregate = {
    userId: '074092',
    balance: 1500.5,
    earned: 3000.75,
    spent: 1500.25,
    payout: 500.0,
    paidOut: 250.0,
    lastUpdated: new Date('2024-01-15T10:30:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAggregationService,
        {
          provide: getRepositoryToken(UserAggregate),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserAggregationService>(UserAggregationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserAggregates', () => {
    it('should return user aggregates when user exists', async () => {
      // Arrange
      const userId = '074092';
      mockRepository.findOne.mockResolvedValue(mockUserAggregate);

      // Act
      const result = await service.getUserAggregates(userId);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual({
        userId: '074092',
        balance: 1500.5,
        earned: 3000.75,
        spent: 1500.25,
        payout: 500.0,
        paidOut: 250.0,
        lastUpdated: '2024-01-15T10:30:00.000Z',
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserAggregates(userId)).rejects.toThrow(
        new NotFoundException(`No data found for user ${userId}`),
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should handle decimal precision correctly', async () => {
      // Arrange
      const userWithDecimals = {
        ...mockUserAggregate,
        balance: '1500.99', // Database might return string
        earned: '3000.01',
      };
      mockRepository.findOne.mockResolvedValue(userWithDecimals);

      // Act
      const result = await service.getUserAggregates('074092');

      // Assert
      expect(result.balance).toBe(1500.99);
      expect(result.earned).toBe(3000.01);
      expect(typeof result.balance).toBe('number');
      expect(typeof result.earned).toBe('number');
    });
  });

  describe('getMultipleUserAggregates', () => {
    it('should return multiple user aggregates', async () => {
      // Arrange
      const userIds = ['074092', '074093'];
      const mockAggregates: UserAggregate[] = [
        mockUserAggregate,
        {
          ...mockUserAggregate,
          userId: '074093',
          balance: 2000.0,
        } as UserAggregate,
      ];
      mockRepository.find.mockResolvedValue(mockAggregates);

      // Act
      const result = await service.getMultipleUserAggregates(userIds);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: expect.anything() }, // In() matcher
      });
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('074092');
      expect(result[1].userId).toBe('074093');
    });

    it('should return empty array when no users found', async () => {
      // Arrange
      const userIds = ['non-existent-1', 'non-existent-2'];
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getMultipleUserAggregates(userIds);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('checkUserBalance', () => {
    it('should return true for user with positive balance', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue({
        ...mockUserAggregate,
        balance: 100.5,
      });

      // Act
      const result = await service.checkUserBalance('074092', 50.0);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for user with zero balance', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue({
        ...mockUserAggregate,
        balance: 0,
      });

      // Act
      const result = await service.checkUserBalance('074092', 50.0);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for user with negative balance', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue({
        ...mockUserAggregate,
        balance: -50.0,
      });

      // Act
      const result = await service.checkUserBalance('074092', 10.0);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when user does not exist', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.checkUserBalance('non-existent', 10.0);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUsersWithPositiveBalance', () => {
    it('should return users with positive balance using query builder', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUserAggregate]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getUsersWithPositiveBalance();

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'userAggregate',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'userAggregate.balance > :balance',
        {
          balance: 0,
        },
      );
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('074092');
    });

    it('should return empty array when no users have positive balance', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getUsersWithPositiveBalance();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockRepository.findOne.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getUserAggregates('074092')).rejects.toThrow(
        dbError,
      );
    });

    it('should handle repository timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Query timeout');
      mockRepository.findOne.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(service.getUserAggregates('074092')).rejects.toThrow(
        timeoutError,
      );
    });
  });
});
