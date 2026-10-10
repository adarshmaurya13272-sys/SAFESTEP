import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emergencyNote: true,
        createdAt: true,
      }
    });
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
    return user;
  }

  async updateProfile(userId: string, input: any) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        phone: input.phone,
        emergencyNote: input.emergencyNote,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emergencyNote: true,
        createdAt: true,
      }
    });
    return user;
  }

  async deleteAccount(userId: string) {
    await prisma.user.delete({
      where: { id: userId }
    });
  }
}
