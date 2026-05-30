import { prisma } from '../db.js';

const TEACHER_ATTENDANCE_HOUR = 12
const TEACHER_ATTENDANCE_MINUTE = 0;
const LATE_GRACE_MINUTES = 15;

const toDateKey = (rawDate) => {
  const d = rawDate ? new Date(rawDate) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const getTodayKey = () => toDateKey(new Date());

const getAttendanceTimeWindow = () => {
  const now = new Date();
  const today = new Date();
  today.setHours(TEACHER_ATTENDANCE_HOUR, TEACHER_ATTENDANCE_MINUTE, 0, 0);
  const lateDeadline = new Date(today.getTime() + LATE_GRACE_MINUTES * 60 * 1000);
  return { now, classTime: today, lateDeadline };
};

const computeTeacherStatus = () => {
  const { now, classTime, lateDeadline } = getAttendanceTimeWindow();
  if (now < classTime) return { status: 'PRESENT', withinWindow: true }; // Early = Present
  if (now <= lateDeadline) return { status: 'LATE', withinWindow: true };  // Within grace = Late
  return { status: null, withinWindow: false }; // Too late — can't self-mark
};

export const markTeacherAttendance = async (req, res) => {
  try {
    const userId = parseInt(req.userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.role !== 'TEACHER') {
      return res.status(403).json({ success: false, message: 'Only teachers can mark their own attendance here.' });
    }

    const dateKey = getTodayKey();
    const { status, withinWindow } = computeTeacherStatus();

    const existing = await prisma.teacherAttendance.findUnique({
      where: { teacherId_date: { teacherId: userId, date: dateKey } },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked your attendance for today.',
        attendance: existing,
      });
    }

    if (!withinWindow) {
      return res.status(403).json({
        success: false,
        message: 'The attendance window has closed. Attendance must be marked before 8:15 AM. Contact an administrator to mark your attendance manually.',
      });
    }

    const { latitude, longitude, location } = req.body;

    const attendance = await prisma.teacherAttendance.create({
      data: {
        teacherId: userId,
        date: dateKey,
        status,
        markedAt: new Date(),
        markedByRole: 'TEACHER',
        location: location ?? null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Attendance marked as ${status}.`,
      attendance,
    });
  } catch (error) {
    console.error('[markTeacherAttendance] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const adminOverrideTeacherAttendance = async (req, res) => {
  try {
    const requestingUserId = parseInt(req.userId);
    const requestingUser = await prisma.user.findUnique({ where: { id: requestingUserId } });

    if (!requestingUser || requestingUser.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only administrators can override teacher attendance.' });
    }

    const { teacherId, date, status, location, latitude, longitude, notes } = req.body;

    if (!teacherId || !date || !status) {
      return res.status(400).json({ success: false, message: 'teacherId, date, and status are required.' });
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const teacher = await prisma.user.findUnique({ where: { id: parseInt(teacherId) } });
    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    const dateKey = toDateKey(date);

    const attendance = await prisma.teacherAttendance.upsert({
      where: { teacherId_date: { teacherId: parseInt(teacherId), date: dateKey } },
      update: {
        status,
        markedByRole: 'ADMIN',
        markedAt: new Date(),
        location: location ?? undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        notes: notes ?? undefined,
      },
      create: {
        teacherId: parseInt(teacherId),
        date: dateKey,
        status,
        markedByRole: 'ADMIN',
        markedAt: new Date(),
        location: location ?? null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        notes: notes ?? null,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Attendance for ${teacher.name} set to ${status} by Admin.`,
      attendance,
    });
  } catch (error) {
    console.error('[adminOverrideTeacherAttendance] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getTeacherAttendance = async (req, res) => {
  try {
    const requestingUserId = parseInt(req.userId);
    const requestingUser = await prisma.user.findUnique({ where: { id: requestingUserId } });

    if (!requestingUser || (requestingUser.role !== 'ADMIN' && requestingUser.role !== 'TEACHER')) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { teacherId, date, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {};

    // Teachers can only see their own records
    if (requestingUser.role === 'TEACHER') {
      where.teacherId = requestingUserId;
    } else if (teacherId) {
      where.teacherId = parseInt(teacherId);
    }

    if (date) {
      where.date = toDateKey(date);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = toDateKey(startDate);
      if (endDate) where.date.lte = toDateKey(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      prisma.teacherAttendance.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ date: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.teacherAttendance.count({ where }),
    ]);

    return res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      attendance: records,
    });
  } catch (error) {
    console.error('[getTeacherAttendance] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getTodayTeacherAttendance = async (req, res) => {
  try {
    const userId = parseInt(req.userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const dateKey = getTodayKey();

    const record = await prisma.teacherAttendance.findUnique({
      where: { teacherId_date: { teacherId: userId, date: dateKey } },
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });

    const { now, classTime, lateDeadline } = getAttendanceTimeWindow();

    return res.json({
      success: true,
      attendance: record || null,
      window: {
        classTime: classTime.toISOString(),
        lateDeadline: lateDeadline.toISOString(),
        isWithinWindow: now <= lateDeadline,
        isLate: now > classTime && now <= lateDeadline,
        isClosed: now > lateDeadline,
      },
    });
  } catch (error) {
    console.error('[getTodayTeacherAttendance] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getAllTeachersToday = async (req, res) => {
  try {
    const requestingUserId = parseInt(req.userId);
    const requestingUser = await prisma.user.findUnique({ where: { id: requestingUserId } });

    if (!requestingUser || requestingUser.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only admins can view all teacher attendance.' });
    }

    const dateKey = getTodayKey();

    const [teachers, attendanceRecords] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'TEACHER' },
        select: { id: true, name: true, email: true, phone: true },
        orderBy: { name: 'asc' },
      }),
      prisma.teacherAttendance.findMany({
        where: { date: dateKey },
        include: { teacher: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const attendanceMap = new Map(attendanceRecords.map(r => [r.teacherId, r]));

    const { now, classTime, lateDeadline } = getAttendanceTimeWindow();

    const result = teachers.map(t => ({
      teacher: t,
      attendance: attendanceMap.get(t.id) || null,
      status: attendanceMap.get(t.id)?.status || (now > lateDeadline ? 'ABSENT' : 'NOT_MARKED'),
    }));

    return res.json({
      success: true,
      date: dateKey.toISOString().split('T')[0],
      teachers: result,
      window: {
        classTime: classTime.toISOString(),
        lateDeadline: lateDeadline.toISOString(),
        isWithinWindow: now <= lateDeadline,
        isClosed: now > lateDeadline,
      },
    });
  } catch (error) {
    console.error('[getAllTeachersToday] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};
