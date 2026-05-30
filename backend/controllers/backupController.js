import { prisma } from '../db.js';

const BACKUP_VERSION = 1;
const RESTORE_CONFIRM_PHRASE = 'RESTORE';

const requireAdmin = (req, res) => {
  if (req.userRole !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Only the school administrator can use backup and restore.',
    });
    return false;
  }
  return true;
};

const serializeRecord = (record) => {
  if (record === null || record === undefined) return record;
  if (record instanceof Date) return record.toISOString();
  if (Array.isArray(record)) return record.map(serializeRecord);
  if (typeof record === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(record)) {
      if (key === 'taughtCourses') continue;
      out[key] = serializeRecord(value);
    }
    return out;
  }
  return record;
};

const buildSummary = (data) => ({
  institutes: data.institutes?.length ?? 0,
  users: data.users?.length ?? 0,
  courses: data.courses?.length ?? 0,
  enrollments: data.enrollments?.length ?? 0,
  attendance: data.attendance?.length ?? 0,
  teacherAttendance: data.teacherAttendance?.length ?? 0,
  alerts: data.alerts?.length ?? 0,
});

const validateBackupPayload = (backup) => {
  if (!backup || backup.version !== BACKUP_VERSION || !backup.data) {
    return 'This file is not a valid AMS backup.';
  }
  const { institutes, users, courses, enrollments, attendance, teacherAttendance, alerts } =
    backup.data;
  const arrays = [institutes, users, courses, enrollments, attendance, teacherAttendance, alerts];
  if (!arrays.every(Array.isArray)) {
    return 'Backup file is missing required data sections.';
  }
  return null;
};

const resetIdSequences = async (tx) => {
  const tables = [
    ['User', 'id'],
    ['Course', 'id'],
    ['Enrollment', 'id'],
    ['Attendance', 'id'],
    ['TeacherAttendance', 'id'],
    ['Alert', 'id'],
  ];

  for (const [table, column] of tables) {
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', '${column}'), COALESCE((SELECT MAX("${column}") FROM "${table}"), 1), true);`
    );
  }
};

const clearAllData = async (tx) => {
  await tx.alert.deleteMany();
  await tx.attendance.deleteMany();
  await tx.teacherAttendance.deleteMany();
  await tx.enrollment.deleteMany();
  await tx.course.deleteMany();
  await tx.user.deleteMany();
  await tx.institute.deleteMany();
};

const toDate = (value) => (value ? new Date(value) : undefined);

export const exportBackup = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const [institutes, users, courses, enrollments, attendance, teacherAttendance, alerts] =
      await Promise.all([
        prisma.institute.findMany(),
        prisma.user.findMany(),
        prisma.course.findMany(),
        prisma.enrollment.findMany(),
        prisma.attendance.findMany(),
        prisma.teacherAttendance.findMany(),
        prisma.alert.findMany(),
      ]);

    const data = {
      institutes: serializeRecord(institutes),
      users: serializeRecord(users),
      courses: serializeRecord(courses),
      enrollments: serializeRecord(enrollments),
      attendance: serializeRecord(attendance),
      teacherAttendance: serializeRecord(teacherAttendance),
      alerts: serializeRecord(alerts),
    };

    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, name: true },
    });

    const backup = {
      version: BACKUP_VERSION,
      app: 'AMS',
      exportedAt: new Date().toISOString(),
      exportedBy: admin ? { name: admin.name, email: admin.email } : null,
      data,
      summary: buildSummary(data),
    };

    res.json({ success: true, backup });
  } catch (error) {
    console.error('[exportBackup]', error);
    res.status(500).json({
      success: false,
      message: 'Could not create backup. Please try again.',
      error: error.message,
    });
  }
};

export const restoreBackup = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { backup, confirmPhrase } = req.body;

    if (confirmPhrase !== RESTORE_CONFIRM_PHRASE) {
      return res.status(400).json({
        success: false,
        message: `Type ${RESTORE_CONFIRM_PHRASE} exactly to confirm restore.`,
      });
    }

    const validationError = validateBackupPayload(backup);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const {
      institutes,
      users,
      courses,
      enrollments,
      attendance,
      teacherAttendance,
      alerts,
    } = backup.data;

    await prisma.$transaction(
      async (tx) => {
        await clearAllData(tx);

        for (const institute of institutes) {
          await tx.institute.create({
            data: {
              id: institute.id,
              name: institute.name,
              maxClass: institute.maxClass ?? 0,
              address: institute.address ?? null,
              phone: institute.phone ?? null,
              lmsSharedSecret: institute.lmsSharedSecret ?? null,
              lmsAllowedDomain: institute.lmsAllowedDomain ?? null,
              createdAt: toDate(institute.createdAt),
              updatedAt: toDate(institute.updatedAt),
            },
          });
        }

        for (const user of users) {
          await tx.user.create({
            data: {
              id: user.id,
              email: user.email,
              password: user.password,
              name: user.name,
              phone: user.phone ?? null,
              role: user.role,
              resetToken: user.resetToken ?? null,
              resetTokenExpiry: toDate(user.resetTokenExpiry),
              instituteId: user.instituteId ?? null,
              createdBy: user.createdBy ?? null,
              permissions: user.permissions ?? [],
              className: user.className ?? null,
              createdAt: toDate(user.createdAt),
              updatedAt: toDate(user.updatedAt),
            },
          });
        }

        for (const course of courses) {
          await tx.course.create({
            data: {
              id: course.id,
              name: course.name,
              code: course.code,
              teacherId: course.teacherId ?? null,
              className: course.className ?? null,
              days: course.days ?? [],
              time: course.time ?? null,
              createdAt: toDate(course.createdAt),
              updatedAt: toDate(course.updatedAt),
            },
          });
        }

        for (const row of enrollments) {
          await tx.enrollment.create({
            data: {
              id: row.id,
              studentId: row.studentId,
              courseId: row.courseId,
              createdAt: toDate(row.createdAt),
            },
          });
        }

        for (const row of attendance) {
          await tx.attendance.create({
            data: {
              id: row.id,
              studentId: row.studentId,
              courseId: row.courseId,
              date: toDate(row.date),
              markedAt: toDate(row.markedAt),
              status: row.status,
              markedByRole: row.markedByRole ?? null,
              location: row.location ?? null,
              notes: row.notes ?? null,
              latitude: row.latitude ?? null,
              longitude: row.longitude ?? null,
            },
          });
        }

        for (const row of teacherAttendance) {
          await tx.teacherAttendance.create({
            data: {
              id: row.id,
              teacherId: row.teacherId,
              date: toDate(row.date),
              markedAt: toDate(row.markedAt),
              status: row.status,
              markedByRole: row.markedByRole ?? null,
              location: row.location ?? null,
              notes: row.notes ?? null,
              latitude: row.latitude ?? null,
              longitude: row.longitude ?? null,
            },
          });
        }

        for (const row of alerts) {
          await tx.alert.create({
            data: {
              id: row.id,
              studentId: row.studentId,
              message: row.message,
              dateTime: toDate(row.dateTime),
              isRead: row.isRead ?? false,
            },
          });
        }

        await resetIdSequences(tx);
      },
      { timeout: 120000 }
    );

    res.json({
      success: true,
      message: 'All data has been restored from your backup file.',
      summary: buildSummary(backup.data),
    });
  } catch (error) {
    console.error('[restoreBackup]', error);
    res.status(500).json({
      success: false,
      message:
        'Restore failed. Your previous data may be incomplete. Use another backup file or contact support.',
      error: error.message,
    });
  }
};
