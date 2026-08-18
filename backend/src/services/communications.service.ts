import prisma from './db';

export class CommunicationsService {
  static async sendMockSms(schoolId: string, senderId: string, recipient: string, content: string) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300)); 

    const log = await prisma.messageLog.create({
      data: {
        schoolId,
        senderId,
        recipient,
        content,
        status: 'DELIVERED',
        type: 'SMS'
      }
    });

    return log;
  }

  static async sendMockEmail(schoolId: string, senderId: string, recipient: string, content: string) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300)); 

    const log = await prisma.messageLog.create({
      data: {
        schoolId,
        senderId,
        recipient,
        content,
        status: 'DELIVERED',
        type: 'EMAIL'
      }
    });

    return log;
  }

  static async broadcastMessage(schoolId: string, senderId: string, content: string, targetType: string, targetIds?: string[]) {
    const logs = [];

    if (targetType === 'ALL_CLASSES' || targetType === 'ALL_PARENTS') {
      const guardians = await prisma.guardian.findMany({
        where: {
          guardianLinks: { some: { student: { schoolId } } },
          phoneNumber: { not: null }
        }
      });
      const promises = guardians.map(g => {
        if (g.phoneNumber) {
          return this.sendMockSms(schoolId, senderId, g.phoneNumber, content);
        }
        return Promise.resolve(null);
      });
      const results = await Promise.all(promises);
      logs.push(...results.filter(r => r !== null));
    } else if (targetType === 'ALL_TEACHERS') {
      const teachers = await prisma.user.findMany({
        where: {
          schoolId,
          role: { in: ['TEACHER', 'FORM_MASTER'] }
        }
      });
      const promises = teachers.map(t => this.sendMockEmail(schoolId, senderId, t.email, content));
      const results = await Promise.all(promises);
      logs.push(...results);
    } else if (targetType === 'SPECIFIC_TEACHERS' && targetIds) {
      const teachers = await prisma.user.findMany({
        where: {
          id: { in: targetIds },
          schoolId
        }
      });
      const promises = teachers.map(t => this.sendMockEmail(schoolId, senderId, t.email, content));
      const results = await Promise.all(promises);
      logs.push(...results);
    } else if ((targetType === 'SPECIFIC_CLASSES' || targetType === 'SPECIFIC_PARENTS') && targetIds) {
      const guardians = await prisma.guardian.findMany({
        where: {
          guardianLinks: {
            some: {
              student: {
                schoolId,
                enrollments: {
                  some: {
                    classId: { in: targetIds }
                  }
                }
              }
            }
          },
          phoneNumber: { not: null }
        }
      });
      const promises = guardians.map(g => {
        if (g.phoneNumber) {
          return this.sendMockSms(schoolId, senderId, g.phoneNumber, content);
        }
        return Promise.resolve(null);
      });
      const results = await Promise.all(promises);
      logs.push(...results.filter(r => r !== null));
    }

    return logs;
  }
}
