import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import crypto from 'crypto';
import { AppError } from '../../middleware/errorHandler';
// Need to assume shared schemas can be imported somehow, let's mock the types or just use any if shared isn't strictly typed here
// since @safestep/shared is an external package
import { RegisterInput, LoginInput } from '@safestep/shared';

export class AuthService {
  async register(input: any) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError(400, 'Email already in use', 'EMAIL_IN_USE');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        phone: input.phone,
        passwordHash,
      }
    });

    return this.generateTokens(user);
  }

  async login(input: any) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string, refreshToken: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId }
      });
    }
  }

  async refresh(refreshToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      }
      throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_TOKEN');
    }

    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    return this.generateTokens(tokenRecord.user);
  }

  private async generateTokens(user: any) {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      }
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }
}
