import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { env } from '../../config/env';

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setCookies(res, accessToken, refreshToken);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setCookies(res, accessToken, refreshToken);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (req.user && refreshToken) {
      await authService.logout(req.user.userId, refreshToken);
    }
    clearCookies(res);
    res.status(200).json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oldRefreshToken = req.cookies.refresh_token;
    if (!oldRefreshToken) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
    }
    const { user, accessToken, refreshToken } = await authService.refresh(oldRefreshToken);
    setCookies(res, accessToken, refreshToken);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
};

function setCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = env.NODE_ENV === 'production';
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 min
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

function clearCookies(res: Response) {
  const isProd = env.NODE_ENV === 'production';
  res.cookie('access_token', '', { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 0 });
  res.cookie('refresh_token', '', { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 0 });
}
