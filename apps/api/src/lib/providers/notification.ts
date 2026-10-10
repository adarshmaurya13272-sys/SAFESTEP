import { logger } from '../logger';
import { prisma } from '../prisma';
import { env } from '../../config/env';

export interface NotificationPayload {
  userId: string;
  type: string;
  channel: 'SMS' | 'PUSH' | 'EMAIL';
  recipient: string;
  payload: any;
}

export interface NotificationProvider {
  send(notification: NotificationPayload): Promise<void>;
}

export class ConsoleProvider implements NotificationProvider {
  async send(notification: NotificationPayload): Promise<void> {
    logger.info({ notification }, 'Sending notification (ConsoleProvider)');
    await prisma.notification.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        channel: notification.channel,
        recipient: notification.recipient,
        payload: notification.payload,
        status: 'SENT',
      }
    });
  }
}

export class TwilioProvider implements NotificationProvider {
  async send(notification: NotificationPayload): Promise<void> {
    logger.info({ notification }, 'Sending notification via Twilio [PLANNED - Using Console Fallback]');
    await prisma.notification.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        channel: notification.channel,
        recipient: notification.recipient,
        payload: notification.payload,
        status: 'SENT',
      }
    });
  }
}

export function getNotificationProvider(): NotificationProvider {
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER) {
    return new TwilioProvider();
  }
  return new ConsoleProvider();
}
