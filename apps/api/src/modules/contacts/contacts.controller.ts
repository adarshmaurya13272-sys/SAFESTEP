import { Request, Response, NextFunction } from 'express';
import { ContactsService } from './contacts.service';

const contactsService = new ContactsService();

export const createContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactsService.createContact(req.user!.userId, req.body);
    res.status(201).json({ data: contact });
  } catch (error) {
    next(error);
  }
};

export const getContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contacts = await contactsService.getContacts(req.user!.userId);
    res.status(200).json({ data: contacts });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await contactsService.deleteContact(req.user!.userId, req.params.id!);
    res.status(200).json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactsService.acceptInvite(req.params.token!);
    res.status(200).json({ data: contact });
  } catch (error) {
    next(error);
  }
};

export const revokeContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactsService.revokeContact(req.user!.userId, req.params.id!);
    res.status(200).json({ data: contact });
  } catch (error) {
    next(error);
  }
};
