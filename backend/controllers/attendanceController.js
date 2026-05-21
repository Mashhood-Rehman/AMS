import { prisma } from '../db.js';
import crypto from 'crypto';
import { sendLowAttendanceEmail, sendManualAttendanceEmail } from '../utils/emailService.js';


const toDateKey = (rawDate) => {
  const d = rawDate ? new Date(rawDate) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

export const markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status, date, location, latitude, longitude, notes } = req.body;

    if (!studentId || !courseId || !status) {
      return res.status(400).json({
        success: false,
        message: 'studentId, courseId, and status are required.',
      });
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const student = await prisma.user.findUnique({ where: { id: parseInt(studentId) } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const dateKey = toDateKey(date);

    // Resolve userRole
    let userRole = req.userRole;
    if (!userRole && req.userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: parseInt(req.userId) } });
      userRole = dbUser?.role;
    }
    userRole = userRole || 'STUDENT';

    // Fetch existing attendance record to verify hierarchy
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_courseId_date: {
          studentId: parseInt(studentId),
          courseId: parseInt(courseId),
          date: dateKey,
        },
      },
    });

    if (existing) {
      if (userRole === 'STUDENT' && (existing.markedByRole === 'TEACHER' || existing.markedByRole === 'ADMIN')) {
        return res.status(403).json({
          success: false,
          message: `This attendance record has been locked by a ${existing.markedByRole.toLowerCase()}.`,
        });
      }
      if (userRole === 'TEACHER' && existing.markedByRole === 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'This attendance record has been locked by an administrator.',
        });
      }
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_courseId_date: {
          studentId: parseInt(studentId),
          courseId: parseInt(courseId),
          date: dateKey,
        },
      },
      update: {
        status,
        markedByRole: userRole,
        location: location ?? undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        notes: notes ?? undefined,
        markedAt: new Date(),
      },
      create: {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        date: dateKey,
        markedAt: new Date(),
        status,
        markedByRole: userRole,
        location: location ?? null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        notes: notes ?? null,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course:  { select: { id: true, name: true, code: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully.',
      attendance,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      status,
      className,
      date,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const where = {};

    if (studentId) where.studentId = parseInt(studentId);
    if (courseId)  where.courseId  = parseInt(courseId);
    if (status)    where.status    = status;
    if (className) where.student = { className };

    // Date filtering
    if (date) {
      where.date = toDateKey(date);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = toDateKey(startDate);
      if (endDate)   where.date.lte = toDateKey(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true, role: true } },
          course:  { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ date: 'desc' }, { student: { name: 'asc' } }],
        skip,
        take: parseInt(limit),
      }),
      prisma.attendance.count({ where }),
    ]);

    return res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      attendance: records,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course:  { select: { id: true, name: true, code: true } },
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    return res.json({ success: true, attendance: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, notes } = req.body;

    const existing = await prisma.attendance.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    if (status) {
      const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${validStatuses.join(', ')}`,
        });
      }
    }

    // Resolve userRole
    let userRole = req.userRole;
    if (!userRole && req.userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: parseInt(req.userId) } });
      userRole = dbUser?.role;
    }
    userRole = userRole || 'STUDENT';

    // Verify role hierarchy
    if (userRole === 'STUDENT' && (existing.markedByRole === 'TEACHER' || existing.markedByRole === 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: `This attendance record has been locked by a ${existing.markedByRole.toLowerCase()}.`,
      });
    }
    if (userRole === 'TEACHER' && existing.markedByRole === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'This attendance record has been locked by an administrator.',
      });
    }

    const updated = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: {
        status:   status   ?? existing.status,
        markedByRole: userRole,
        location: location !== undefined ? location : existing.location,
        notes:    notes    !== undefined ? notes    : existing.notes,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course:  { select: { id: true, name: true, code: true } },
      },
    });

    return res.json({ success: true, message: 'Attendance updated.', attendance: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.attendance.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    await prisma.attendance.delete({ where: { id: parseInt(id) } });
    return res.json({ success: true, message: 'Attendance record deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getAttendanceByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, startDate, endDate } = req.query;
    const providedQuery = Object.fromEntries(
      Object.entries({ date, startDate, endDate }).filter(([, v]) => v !== undefined)
    );
    console.log(`[getAttendanceByCourse] courseId=${courseId} query=${JSON.stringify(providedQuery)}`);

    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const dateFilter = {};
    if (date) {
      dateFilter.date = toDateKey(date);
    } else if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = toDateKey(startDate);
      if (endDate)   dateFilter.date.lte = toDateKey(endDate);
    }

    const records = await prisma.attendance.findMany({
      where: { courseId: parseInt(courseId), ...dateFilter },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ date: 'desc' }, { student: { name: 'asc' } }],
    });

    return res.json({ success: true, course, attendance: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate } = req.query;

    const student = await prisma.user.findUnique({ where: { id: parseInt(studentId) } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const where = { studentId: parseInt(studentId) };
    if (courseId) where.courseId = parseInt(courseId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = toDateKey(startDate);
      if (endDate)   where.date.lte = toDateKey(endDate);
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ date: 'desc' }, { course: { name: 'asc' } }],
    });

    return res.json({ success: true, student: { id: student.id, name: student.name, email: student.email }, attendance: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getAttendanceSummary = async (req, res) => {
  try {
    const { courseId, studentId, startDate, endDate } = req.query;

    const where = {};
    if (courseId)  where.courseId  = parseInt(courseId);
    if (studentId) where.studentId = parseInt(studentId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = toDateKey(startDate);
      if (endDate)   where.date.lte = toDateKey(endDate);
    }

    // Raw group-by via Prisma groupBy
    const grouped = await prisma.attendance.groupBy({
      by: ['studentId', 'courseId', 'status'],
      where,
      _count: { status: true },
    });

    // Pivot grouped rows into a summary map keyed by "studentId-courseId"
    const summaryMap = {};

    for (const row of grouped) {
      const key = `${row.studentId}-${row.courseId}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          studentId: row.studentId,
          courseId:  row.courseId,
          PRESENT: 0,
          ABSENT:  0,
          LATE:    0,
        };
      }
      summaryMap[key][row.status] = row._count.status;
    }

    // Enrich each summary entry with student and course details
    const summaries = await Promise.all(
      Object.values(summaryMap).map(async (entry) => {
        const [student, course] = await Promise.all([
          prisma.user.findUnique({
            where: { id: entry.studentId },
            select: { id: true, name: true, email: true },
          }),
          prisma.course.findUnique({
            where: { id: entry.courseId },
            select: { id: true, name: true, code: true },
          }),
        ]);

        const total      = entry.PRESENT + entry.ABSENT + entry.LATE;
        const percentage = total > 0 ? Math.round(((entry.PRESENT + entry.LATE) / total) * 100) : 0;

        return {
          student,
          course,
          present:    entry.PRESENT,
          absent:     entry.ABSENT,
          late:       entry.LATE,
          total,
          attendancePercentage: percentage,
        };
      })
    );

    return res.json({ success: true, summary: summaries });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const bulkMarkAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body;
    console.log('[BACKEND bulkMarkAttendance] Request received. courseId:', courseId, 'date:', date);
    console.log('[BACKEND bulkMarkAttendance] Records to save:', JSON.stringify(records, null, 2));

    if (!courseId || !Array.isArray(records) || records.length === 0) {
      console.warn('[BACKEND bulkMarkAttendance] Invalid body parameters.');
      return res.status(400).json({
        success: false,
        message: 'courseId and a non-empty records array are required.',
      });
    }

    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      console.warn('[BACKEND bulkMarkAttendance] Course not found for ID:', courseId);
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    const dateKey       = toDateKey(date);
    console.log('[BACKEND bulkMarkAttendance] Resolved dateKey:', dateKey.toISOString());
    const results       = [];
    const errors        = [];

    // Resolve userRole
    let userRole = req.userRole;
    if (!userRole && req.userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: parseInt(req.userId) } });
      userRole = dbUser?.role;
    }
    userRole = userRole || 'STUDENT';
    console.log('[BACKEND bulkMarkAttendance] User making request - ID:', req.userId, 'Role:', userRole);

    for (const record of records) {
      const { studentId, status, location, latitude, longitude, notes } = record;
      console.log(`[BACKEND bulkMarkAttendance] Processing studentId: ${studentId}, status: ${status}`);

      if (!studentId || !status) {
        console.warn(`[BACKEND bulkMarkAttendance] Missing studentId or status for record:`, record);
        errors.push({ studentId, reason: 'studentId and status are required.' });
        continue;
      }

      if (status === 'PENDING') {
        console.warn(`[BACKEND bulkMarkAttendance] Skipping studentId ${studentId} because status is PENDING.`);
        continue;
      }

      if (!validStatuses.includes(status)) {
        console.warn(`[BACKEND bulkMarkAttendance] Invalid status "${status}" for studentId:`, studentId);
        errors.push({ studentId, reason: `Invalid status "${status}".` });
        continue;
      }

      try {
        // Fetch existing attendance record to verify hierarchy
        const existing = await prisma.attendance.findUnique({
          where: {
            studentId_courseId_date: {
              studentId: parseInt(studentId),
              courseId: parseInt(courseId),
              date: dateKey,
            },
          },
        });
        console.log(`[BACKEND bulkMarkAttendance] Existing record for studentId ${studentId}:`, existing);

        if (existing) {
          if (userRole === 'STUDENT' && (existing.markedByRole === 'TEACHER' || existing.markedByRole === 'ADMIN')) {
            console.warn(`[BACKEND bulkMarkAttendance] Lock violation: Student blocked from modifying record marked by ${existing.markedByRole}`);
            errors.push({ studentId, reason: `Locked by a ${existing.markedByRole.toLowerCase()}.` });
            continue;
          }
          if (userRole === 'TEACHER' && existing.markedByRole === 'ADMIN') {
            console.warn(`[BACKEND bulkMarkAttendance] Lock violation: Teacher blocked from modifying record marked by ADMIN`);
            errors.push({ studentId, reason: 'Locked by an administrator.' });
            continue;
          }
        }

        console.log(`[BACKEND bulkMarkAttendance] Performing upsert for studentId: ${studentId}`);
        const upserted = await prisma.attendance.upsert({
          where: {
            studentId_courseId_date: {
              studentId: parseInt(studentId),
              courseId:  parseInt(courseId),
              date:      dateKey,
            },
          },
          update: {
            status,
            markedByRole: userRole,
            location: location ?? undefined,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            notes:    notes    ?? undefined,
            markedAt: new Date(),
          },
          create: {
            studentId: parseInt(studentId),
            courseId:  parseInt(courseId),
            date:      dateKey,
            markedAt:  new Date(),
            status,
            markedByRole: userRole,
            location:  location ?? null,
            latitude:  latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            notes:     notes    ?? null,
          },
        });
        console.log(`[BACKEND bulkMarkAttendance] Upsert successful for studentId ${studentId}:`, upserted);
        results.push(upserted);
      } catch (err) {
        console.error(`[BACKEND bulkMarkAttendance] Database error for studentId ${studentId}:`, err);
        errors.push({ studentId, reason: err.message });
      }
    }

    console.log(`[BACKEND bulkMarkAttendance] Finished. Saved count: ${results.length}, Errors:`, errors);
    return res.status(200).json({
      success: true,
      message: `${results.length} record(s) saved. ${errors.length} error(s).`,
      saved:  results.length,
      errors,
    });
  } catch (error) {
    console.error('[BACKEND bulkMarkAttendance] Critical controller error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── QR Attendance Helpers & Endpoints ──────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const generateQRToken = (courseId, dateStr, studentId = null) => {
  const timeBucket = Math.floor(Date.now() / (1000 * 60 * 15)); // Valid for 15-minute intervals
  const baseString = studentId 
    ? `${courseId}-${dateStr}-${studentId}-${timeBucket}` 
    : `${courseId}-${dateStr}-${timeBucket}`;
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(baseString)
    .digest('hex');
};

export const verifyQRToken = (courseId, dateStr, token, studentId = null) => {
  const timeBucketCurrent = Math.floor(Date.now() / (1000 * 60 * 15));
  const timeBucketPrev = timeBucketCurrent - 1;

  const baseStringCurrent = studentId 
    ? `${courseId}-${dateStr}-${studentId}-${timeBucketCurrent}` 
    : `${courseId}-${dateStr}-${timeBucketCurrent}`;
  const baseStringPrev = studentId 
    ? `${courseId}-${dateStr}-${studentId}-${timeBucketPrev}` 
    : `${courseId}-${dateStr}-${timeBucketPrev}`;

  const hashCurrent = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(baseStringCurrent)
    .digest('hex');
  const hashPrev = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(baseStringPrev)
    .digest('hex');

  return token === hashCurrent || token === hashPrev;
};

export const getQRToken = async (req, res) => {
  try {
    const { courseId } = req.params;
    const requestingUserId = req.userId;
    console.log(`[QR ATTENDANCE VERIFICATION] Generating QR Token request: courseId=${courseId}, req.userId=${requestingUserId}`);

    const user = await prisma.user.findUnique({ where: { id: parseInt(requestingUserId) } });
    const isStudent = user?.role === 'STUDENT';
    const isTeacher = user?.role === 'TEACHER';
    const boundId = (isStudent || isTeacher) ? parseInt(requestingUserId) : null;

    const dateStr = new Date().toISOString().split('T')[0];
    const token = generateQRToken(courseId, dateStr, boundId);

    console.log(`[QR ATTENDANCE VERIFICATION] Generated token bound to userId=${boundId}`);
    return res.status(200).json({
      success: true,
      token,
      courseId: parseInt(courseId),
      date: dateStr
    });
  } catch (error) {
    console.error(`[QR ATTENDANCE VERIFICATION] Failed to generate token:`, error);
    return res.status(500).json({ success: false, message: 'Failed to generate token.', error: error.message });
  }
};

export const markAttendanceQR = async (req, res) => {
  try {
    const { courseId, token, desktopUserId } = req.body;
    const mobileUserId = req.userId;

    console.log(`[QR ATTENDANCE VERIFICATION] Attempting QR Check-in: courseId=${courseId}, mobileUserId=${mobileUserId}, desktopUserId=${desktopUserId}`);

    if (!courseId || !token) {
      console.warn(`[QR ATTENDANCE VERIFICATION] Missing parameters: courseId=${courseId}, token=${token}`);
      return res.status(400).json({
        success: false,
        message: 'courseId and token are required.',
      });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const expectedUserId = desktopUserId ? parseInt(desktopUserId) : parseInt(mobileUserId);
    const isTokenValid = verifyQRToken(courseId, dateStr, token, expectedUserId);
    if (!isTokenValid) {
      console.warn(`[QR ATTENDANCE VERIFICATION] Invalid or expired token: ${token} for expectedUserId=${expectedUserId}`);
      return res.status(400).json({
        success: false,
        message: 'The scanned QR code is invalid or has expired. Please ask the instructor or refresh your desktop page.',
      });
    }

    // Crucial validation: Ensure the mobile user is indeed the same user as the logged-in desktop session user
    if (desktopUserId && parseInt(desktopUserId) !== parseInt(mobileUserId)) {
      console.warn(`[QR ATTENDANCE VERIFICATION] MISMATCH DETECTED: Mobile user (ID=${mobileUserId}) does not match desktop user (ID=${desktopUserId})`);
      return res.status(403).json({
        success: false,
        message: 'Mismatch Error: The logged-in user on this phone does not match the active desktop session!',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(mobileUserId) } });
    if (!user) {
      console.warn(`[QR ATTENDANCE VERIFICATION] User account not found: ID=${mobileUserId}`);
      return res.status(404).json({
        success: false,
        message: 'User account could not be found.',
      });
    }

    if (user.role === 'TEACHER') {
      const today = new Date();
      const classTime = new Date(today);
      classTime.setHours(8, 0, 0, 0);
      const lateDeadline = new Date(classTime.getTime() + 15 * 60 * 1000);

      if (new Date() > lateDeadline) {
        return res.status(403).json({
          success: false,
          message: 'The attendance window has closed for teacher QR check-in. Please contact an administrator.',
        });
      }

      const status = new Date() < classTime ? 'PRESENT' : 'LATE';
      const dateKey = toDateKey(dateStr);

      const attendance = await prisma.teacherAttendance.upsert({
        where: { teacherId_date: { teacherId: parseInt(mobileUserId), date: dateKey } },
        update: {
          status,
          markedByRole: 'TEACHER',
          notes: 'Marked automatically via QR Code scan',
          location: req.body.location ?? null,
          latitude: req.body.latitude ?? null,
          longitude: req.body.longitude ?? null,
          markedAt: new Date(),
        },
        create: {
          teacherId: parseInt(mobileUserId),
          date: dateKey,
          status,
          markedByRole: 'TEACHER',
          notes: 'Marked automatically via QR Code scan',
          location: req.body.location ?? null,
          latitude: req.body.latitude ?? null,
          longitude: req.body.longitude ?? null,
          markedAt: new Date(),
        },
        include: {
          teacher: { select: { id: true, name: true, email: true } },
        },
      });

      return res.status(200).json({
        success: true,
        message: `Teacher attendance marked as ${status}.`,
        attendance,
      });
    }

    // Verify student exists
    const student = await prisma.user.findUnique({ where: { id: parseInt(mobileUserId) } });
    if (!student) {
      console.warn(`[QR ATTENDANCE VERIFICATION] Student account not found: ID=${mobileUserId}`);
      return res.status(404).json({
        success: false,
        message: 'Student account could not be found.',
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      console.warn(`[QR ATTENDANCE VERIFICATION] Course not found: ID=${courseId}`);
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Verify that the student is enrolled in the course OR shares the same className
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: parseInt(mobileUserId),
          courseId: parseInt(courseId),
        },
      },
    });

    const isSameClass = !!(student.className && course.className && student.className === course.className);

    if (!enrollment && !isSameClass) {
      console.warn(`[QR ATTENDANCE VERIFICATION] Student ID=${mobileUserId} is not enrolled or shares the same class as course ID=${courseId}`);
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course.',
      });
    }

    const dateKey = toDateKey(dateStr);

    // Verify role hierarchy: QR scanning is always STUDENT role
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_courseId_date: {
          studentId: parseInt(mobileUserId),
          courseId: parseInt(courseId),
          date: dateKey,
        },
      },
    });

    if (existing && (existing.markedByRole === 'TEACHER' || existing.markedByRole === 'ADMIN')) {
      console.warn(`[QR ATTENDANCE VERIFICATION] FAILED: Locked by ${existing.markedByRole}`);
      return res.status(403).json({
        success: false,
        message: `This attendance record has been locked by a ${existing.markedByRole.toLowerCase()}.`,
      });
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_courseId_date: {
          studentId: parseInt(mobileUserId),
          courseId: parseInt(courseId),
          date: dateKey,
        },
      },
      update: {
        status: 'PRESENT',
        markedByRole: 'STUDENT',
        notes: 'Marked automatically via match-validated QR Code scan',
        location: req.body.location ?? undefined,
        markedAt: new Date(),
      },
      create: {
        studentId: parseInt(mobileUserId),
        courseId: parseInt(courseId),
        date: dateKey,
        markedAt: new Date(),
        status: 'PRESENT',
        markedByRole: 'STUDENT',
        location: req.body.location ?? null,
        notes: 'Marked automatically via match-validated QR Code scan',
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course:  { select: { id: true, name: true, code: true } },
      },
    });

    console.log(`[QR ATTENDANCE VERIFICATION] SUCCESS: Marked PRESENT for ${student.email} in ${course.name}`);
    return res.status(200).json({
      success: true,
      message: `Attendance for ${course.name} marked successfully!`,
      attendance,
    });
  } catch (error) {
    console.error(`[QR ATTENDANCE VERIFICATION] Failed to record QR attendance:`, error);
    return res.status(500).json({ success: false, message: 'Failed to record QR attendance.', error: error.message });
  }
};

// ─── Low Attendance Email Alert System ───────────────────────────────────────

const countExpectedClasses = (courseDays, startStr, endStr) => {
  if (!courseDays || !courseDays.length || !startStr || !endStr) return 0;

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

  let count = 0;
  const current = new Date(start);

  const daysMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };

  const targetDayIndices = courseDays.map(d => daysMap[d]).filter(idx => idx !== undefined);

  while (current <= end) {
    if (targetDayIndices.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

export const sendLowAttendanceAlerts = async (req, res) => {
  try {
    const { courseId, className, month, year, bypassDateCheck } = req.body;

    if (!courseId || !className || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'courseId, className, month, and year are required.',
      });
    }

    const currentDay = new Date().getDate();
    if (currentDay !== 25 && !bypassDateCheck) {
      return res.status(400).json({
        success: false,
        message: 'Low attendance notification emails can only be sent on the 25th day of the month to ensure a representative monthly attendance summary.',
      });
    }

    // 1. Fetch the course
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // 2. Fetch students in the class
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        className: className,
      },
    });

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No students found in this class.',
        sentCount: 0,
        sentTo: []
      });
    }

    // 3. Resolve start & end date for the selected month/year
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const startDateStr = firstDay.toISOString().split('T')[0];
    const endDateStr = lastDay.toISOString().split('T')[0];

    // 4. Clamp expected classes by course creation date
    const courseCreatedDate = course.createdAt ? new Date(course.createdAt) : null;
    let effectiveStartDate = firstDay;
    if (courseCreatedDate && courseCreatedDate > firstDay) {
      effectiveStartDate = courseCreatedDate;
    }
    if (courseCreatedDate && courseCreatedDate > lastDay) {
      return res.status(400).json({
        success: false,
        message: 'Course was created after the selected month; cannot calculate attendance rate for this period.',
      });
    }
    const effectiveStartDateStr = effectiveStartDate.toISOString().split('T')[0];

    // 5. Calculate expected classes using countExpectedClasses
    const expectedClasses = countExpectedClasses(course.days || [], effectiveStartDateStr, endDateStr);

    if (expectedClasses === 0) {
      return res.status(400).json({
        success: false,
        message: 'No scheduled teaching sessions found for this course in the selected month/year. Cannot calculate attendance rate.',
      });
    }

    // 5. Fetch all attendance records for these students in this course & month
    const studentIds = students.map(s => s.id);
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId: parseInt(courseId),
        studentId: { in: studentIds },
        date: {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lte: new Date(Date.UTC(year, month, 0, 23, 59, 59)),
        },
      },
    });

    // Map records for quick lookup
    const recordsMap = {};
    attendanceRecords.forEach(rec => {
      if (!recordsMap[rec.studentId]) {
        recordsMap[rec.studentId] = [];
      }
      recordsMap[rec.studentId].push(rec);
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[month - 1];

    let sentCount = 0;
    const sentTo = [];

    // 6. Calculate rate and send warning emails for students below 80%
    for (const student of students) {
      const studentRecs = recordsMap[student.id] || [];
      let present = 0;
      let late = 0;

      studentRecs.forEach(rec => {
        if (rec.status === 'PRESENT') present++;
        else if (rec.status === 'LATE') late++;
      });

      const rate = Math.round(((present + late) / expectedClasses) * 100);

      // Low attendance warning threshold is less than 80%
      if (rate < 80) {
        // Send email alert
        const emailResult = await sendLowAttendanceEmail(
          student.email,
          student.name,
          rate,
          monthName,
          course.name
        );

        if (emailResult.success) {
          sentCount++;
          sentTo.push({ id: student.id, name: student.name, email: student.email, rate });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed monthly low-attendance system. Sent warning emails to ${sentCount} students.`,
      sentCount,
      sentTo,
    });

  } catch (error) {
    console.error('[sendLowAttendanceAlerts] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message,
    });
  }
};

export const getStudentAttendanceSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    // 1. Fetch student profile
    const student = await prisma.user.findUnique({
      where: { id: parseInt(studentId) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        className: true,
        createdAt: true,
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // 2. Fetch courses either enrolled or matching className
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { enrollments: { some: { studentId: student.id } } },
          student.className ? { className: student.className } : null
        ].filter(Boolean)
      },
      include: {
        teacher: { select: { id: true, name: true } }
      }
    });

    // 3. For each course, aggregate attendance metrics
    const summary = [];

    for (const course of courses) {
      const records = await prisma.attendance.findMany({
        where: {
          studentId: student.id,
          courseId: course.id,
        }
      });

      let present = 0;
      let late = 0;
      let absent = 0;

      records.forEach(rec => {
        if (rec.status === 'PRESENT') present++;
        else if (rec.status === 'LATE') late++;
        else if (rec.status === 'ABSENT') absent++;
      });

      // Calculate expected classes from student creation or course creation, whichever is later
      const startRange = course.createdAt > student.createdAt ? course.createdAt : student.createdAt;
      const today = new Date();
      const expected = countExpectedClasses(course.days || [], startRange.toISOString().split('T')[0], today.toISOString().split('T')[0]);

      const rate = expected > 0 ? Math.round(((present + late) / expected) * 100) : 100;

      summary.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        teacherName: course.teacher?.name || 'N/A',
        expected,
        present,
        late,
        absent,
        rate
      });
    }

    return res.json({
      success: true,
      student,
      summary
    });
  } catch (error) {
    console.error('[getStudentAttendanceSummary] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student attendance summary.', error: error.message });
  }
};

export const sendManualAttendanceAlert = async (req, res) => {
  try {
    const { studentId, customMessage } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required.' });
    }

    // 1. Fetch student
    const student = await prisma.user.findUnique({
      where: { id: parseInt(studentId) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        className: true,
        createdAt: true,
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // 2. Fetch courses either enrolled or matching className
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { enrollments: { some: { studentId: student.id } } },
          student.className ? { className: student.className } : null
        ].filter(Boolean)
      },
      include: {
        teacher: { select: { id: true, name: true } }
      }
    });

    // 3. For each course, aggregate attendance metrics
    const summary = [];

    for (const course of courses) {
      const records = await prisma.attendance.findMany({
        where: {
          studentId: student.id,
          courseId: course.id,
        }
      });

      let present = 0;
      let late = 0;
      let absent = 0;

      records.forEach(rec => {
        if (rec.status === 'PRESENT') present++;
        else if (rec.status === 'LATE') late++;
        else if (rec.status === 'ABSENT') absent++;
      });

      // Calculate expected classes from student creation or course creation, whichever is later
      const startRange = course.createdAt > student.createdAt ? course.createdAt : student.createdAt;
      const today = new Date();
      const expected = countExpectedClasses(course.days || [], startRange.toISOString().split('T')[0], today.toISOString().split('T')[0]);

      const rate = expected > 0 ? Math.round(((present + late) / expected) * 100) : 100;

      summary.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        teacherName: course.teacher?.name || 'N/A',
        expected,
        present,
        late,
        absent,
        rate
      });
    }

    // 4. Send email
    const emailResult = await sendManualAttendanceEmail(student.email, student.name, summary, customMessage);

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send manual warning email.' });
    }

    return res.json({
      success: true,
      message: `Successfully sent manual attendance report/alert email to ${student.name} (${student.email}).`
    });
  } catch (error) {
    console.error('[sendManualAttendanceAlert] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};




