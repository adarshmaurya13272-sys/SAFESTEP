import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import crypto from 'crypto';

export class ContactsService {
  async createContact(userId: string, input: any) {
    const count = await prisma.trustedContact.count({
      where: { userId }
    });
    if (count >= 5) {
      throw new AppError(400, 'Maximum 5 trusted contacts allowed', 'MAX_CONTACTS_REACHED');
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const contact = await prisma.trustedContact.create({
      data: {
        userId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        status: 'PENDING',
        inviteToken,
      }
    });

    return contact;
  }

  async getContacts(userId: string) {
    return prisma.trustedContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteContact(userId: string, contactId: string) {
    const contact = await prisma.trustedContact.findUnique({ where: { id: contactId } });
    if (!contact || contact.userId !== userId) {
      throw new AppError(404, 'Contact not found', 'NOT_FOUND');
    }
    await prisma.trustedContact.delete({ where: { id: contactId } });
  }

  async acceptInvite(token: string) {
    const contact = await prisma.trustedContact.findUnique({ where: { inviteToken: token } });
    if (!contact) {
      throw new AppError(404, 'Invalid or expired invite', 'INVALID_INVITE');
    }
    if (contact.status === 'ACCEPTED') {
      return contact;
    }

    return prisma.trustedContact.update({
      where: { id: contact.id },
      data: {
        status: 'ACCEPTED',
        consentedAt: new Date(),
      }
    });
  }

  async revokeContact(userId: string, contactId: string) {
    const contact = await prisma.trustedContact.findUnique({ where: { id: contactId } });
    if (!contact || contact.userId !== userId) {
      throw new AppError(404, 'Contact not found', 'NOT_FOUND');
    }
    
    return prisma.trustedContact.update({
      where: { id: contactId },
      data: { status: 'REVOKED' }
    });
  }
}
