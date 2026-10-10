import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

const usersService = new UsersService();

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.getProfile(req.user!.userId);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.updateProfile(req.user!.userId, req.body);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await usersService.deleteAccount(req.user!.userId);
    res.cookie('access_token', '', { maxAge: 0 });
    res.cookie('refresh_token', '', { maxAge: 0 });
    res.status(200).json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
};
