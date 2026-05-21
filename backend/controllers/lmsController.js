import { prisma } from '../db.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const DEFAULT_PERMISSIONS = ['dashboard', 'edit-profile'];

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  return email.toLowerCase().trim();
};

const hashRandomPassword = async () => {
  const password = crypto.randomBytes(24).toString('hex');
  return await bcrypt.hash(password, 10);
};

const createOrUpdateUser = async ({ email, name, phone, className }, role, instituteId, createdBy) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !name) {
    throw new Error('Each user must include email and name.');
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const data = {
    email: normalizedEmail,
    name,
    phone: phone !== undefined ? phone : undefined,
    role,
    permissions: DEFAULT_PERMISSIONS,
    ...(role === 'STUDENT' ? { className: className || null } : {}),
    ...(instituteId ? { institute: { connect: { id: instituteId } } } : {}),
    createdBy: createdBy || null,
  };

  if (existing) {
    const updateData = {
      name: data.name,
      phone: data.phone,
      ...(existing.role !== 'ADMIN' ? { permissions: { set: DEFAULT_PERMISSIONS } } : {}),
      ...(instituteId ? { institute: { connect: { id: instituteId } } } : {}),
    };

    if (existing.role !== 'ADMIN') {
      updateData.role = role;
    }
    if (role === 'STUDENT' && className !== undefined) {
      updateData.className = className;
    }

    return await prisma.user.update({ where: { id: existing.id }, data: updateData });
  }

  const passwordHash = await hashRandomPassword();
  return await prisma.user.create({
    data: {
      ...data,
      password: passwordHash,
    },
  });
};

const createOrUpdateCourse = async ({ code, name, className, time, days, teacherEmail }, teacherLookup) => {
  if (!code || !name) {
    throw new Error('Each course must include code and name.');
  }

  const trimmedCode = code.trim();
  const existing = await prisma.course.findUnique({ where: { code: trimmedCode } });
  const teacher = teacherEmail ? await teacherLookup(normalizeEmail(teacherEmail)) : null;

  const courseData = {
    name,
    className: className !== undefined ? className : existing?.className ?? null,
    time: time !== undefined ? time : existing?.time ?? null,
    days: Array.isArray(days) ? days : existing?.days ?? [],
    ...(teacher ? { teacher: { connect: { id: teacher.id } } } : {}),
  };

  if (existing) {
    return await prisma.course.update({ where: { id: existing.id }, data: courseData });
  }

  return await prisma.course.create({
    data: {
      code: trimmedCode,
      ...courseData,
    },
  });
};

const createEnrollment = async ({ studentEmail, courseCode }) => {
  const normalizedEmail = normalizeEmail(studentEmail);
  const trimmedCode = courseCode?.trim();
  if (!normalizedEmail || !trimmedCode) {
    throw new Error('Each enrollment must include studentEmail and courseCode.');
  }

  const student = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const course = await prisma.course.findUnique({ where: { code: trimmedCode } });

  if (!student) {
    throw new Error(`Student not found for email: ${studentEmail}`);
  }
  if (!course) {
    throw new Error(`Course not found for code: ${courseCode}`);
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: student.id,
        courseId: course.id,
      },
    },
  });

  if (existing) return existing;

  return await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: course.id,
    },
  });
};

// 1. Get LMS configuration for the logged-in user
// Re-generated client loaded
export const getLmsConfig = async (req, res) => {
  try {
    console.log('[getLmsConfig] User requesting config. User ID:', req.userId);

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { instituteId: true, role: true, name: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please log in again.',
      });
    }

    let institute = null;

    if (!user.instituteId) {
      if (user.role !== 'ADMIN') {
        return res.status(404).json({
          success: false,
          message: 'No institute associated with this user account. Please assign an institute first.',
        });
      }

      institute = await prisma.institute.findFirst();
      if (!institute) {
        institute = await prisma.institute.create({
          data: {
            name: user.name || 'Default Institute',
          },
        });
        await prisma.user.update({
          where: { id: req.userId },
          data: { institute: { connect: { id: institute.id } } },
        });
      } else {
        await prisma.user.update({
          where: { id: req.userId },
          data: { institute: { connect: { id: institute.id } } },
        });
      }
    } else {
      institute = await prisma.institute.findUnique({
        where: { id: user.instituteId },
      });
    }

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: 'No institute found for this user account. Please assign an institute first.',
      });
    }

    // If no shared secret is generated yet, generate one automatically
    if (!institute.lmsSharedSecret) {
      const randomSecret = crypto.randomBytes(32).toString('hex');
      const updatedInstitute = await prisma.institute.update({
        where: { id: institute.id },
        data: { lmsSharedSecret: randomSecret },
      });
      institute.lmsSharedSecret = updatedInstitute.lmsSharedSecret;
    }

    res.json({
      success: true,
      config: {
        instituteId: institute.id,
        instituteName: institute.name,
        lmsSharedSecret: institute.lmsSharedSecret,
        lmsAllowedDomain: institute.lmsAllowedDomain || '',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const ensureInstitute = async (instituteId) => {
  if (!instituteId) {
    throw new Error('instituteId is required');
  }
  const institute = await prisma.institute.findUnique({ where: { id: instituteId } });
  if (!institute) {
    throw new Error('Institute not found');
  }
  return institute;
};

const buildTeacherLookup = (teacherMap) => async (normalizedEmail) => {
  if (!normalizedEmail) return null;
  if (teacherMap.has(normalizedEmail)) return teacherMap.get(normalizedEmail);
  return await prisma.user.findUnique({ where: { email: normalizedEmail } });
};

export const syncLmsData = async (req, res) => {
  const { instituteId, teachers = [], students = [], courses = [], enrollments = [] } = req.body;

  try {
    await ensureInstitute(instituteId);

    const teacherMap = new Map();
    let teachersSynced = 0;
    const teacherErrors = [];

    if (Array.isArray(teachers)) {
      for (const teacher of teachers) {
        try {
          const createdTeacher = await createOrUpdateUser(teacher, 'TEACHER', instituteId, req.userId);
          teacherMap.set(normalizeEmail(createdTeacher.email), createdTeacher);
          teachersSynced += 1;
        } catch (error) {
          teacherErrors.push({ teacher, reason: error.message });
        }
      }
    }

    let studentsSynced = 0;
    const studentErrors = [];
    if (Array.isArray(students)) {
      for (const student of students) {
        try {
          await createOrUpdateUser(student, 'STUDENT', instituteId, req.userId);
          studentsSynced += 1;
        } catch (error) {
          studentErrors.push({ student, reason: error.message });
        }
      }
    }

    let coursesSynced = 0;
    const courseErrors = [];
    if (Array.isArray(courses)) {
      const lookupTeacher = buildTeacherLookup(teacherMap);
      for (const course of courses) {
        try {
          await createOrUpdateCourse(course, lookupTeacher);
          coursesSynced += 1;
        } catch (error) {
          courseErrors.push({ course, reason: error.message });
        }
      }
    }

    let enrollmentsSynced = 0;
    const enrollmentErrors = [];
    if (Array.isArray(enrollments)) {
      for (const enrollment of enrollments) {
        try {
          await createEnrollment(enrollment);
          enrollmentsSynced += 1;
        } catch (error) {
          enrollmentErrors.push({ enrollment, reason: error.message });
        }
      }
    }

    return res.json({
      success: true,
      message: 'LMS sync completed',
      summary: {
        teachers: teachersSynced,
        students: studentsSynced,
        courses: coursesSynced,
        enrollments: enrollmentsSynced,
      },
      errors: {
        teachers: teacherErrors,
        students: studentErrors,
        courses: courseErrors,
        enrollments: enrollmentErrors,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'LMS sync failed', error: error.message });
  }
};

export const syncLmsTeachers = async (req, res) => {
  const { instituteId, teachers = [] } = req.body;
  try {
    await ensureInstitute(instituteId);
    let teachersSynced = 0;
    const errors = [];

    for (const teacher of teachers) {
      try {
        await createOrUpdateUser(teacher, 'TEACHER', instituteId, req.userId);
        teachersSynced += 1;
      } catch (error) {
        errors.push({ teacher, reason: error.message });
      }
    }

    return res.json({ success: true, teachersSynced, errors });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Teacher sync failed', error: error.message });
  }
};

export const syncLmsStudents = async (req, res) => {
  const { instituteId, students = [] } = req.body;
  try {
    await ensureInstitute(instituteId);
    let studentsSynced = 0;
    const errors = [];

    for (const student of students) {
      try {
        await createOrUpdateUser(student, 'STUDENT', instituteId, req.userId);
        studentsSynced += 1;
      } catch (error) {
        errors.push({ student, reason: error.message });
      }
    }

    return res.json({ success: true, studentsSynced, errors });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Student sync failed', error: error.message });
  }
};

export const syncLmsCourses = async (req, res) => {
  const { courses = [], teachers = [] } = req.body;
  try {
    const teacherMap = new Map();
    const lookupTeacher = buildTeacherLookup(teacherMap);
    let coursesSynced = 0;
    const errors = [];

    if (Array.isArray(teachers)) {
      for (const teacher of teachers) {
        const normalizedEmail = normalizeEmail(teacher.email);
        if (!normalizedEmail) continue;
        const existingTeacher = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingTeacher) teacherMap.set(normalizedEmail, existingTeacher);
      }
    }

    for (const course of courses) {
      try {
        await createOrUpdateCourse(course, lookupTeacher);
        coursesSynced += 1;
      } catch (error) {
        errors.push({ course, reason: error.message });
      }
    }

    return res.json({ success: true, coursesSynced, errors });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Course sync failed', error: error.message });
  }
};

export const syncLmsEnrollments = async (req, res) => {
  const { enrollments = [] } = req.body;
  try {
    let enrollmentsSynced = 0;
    const errors = [];

    for (const enrollment of enrollments) {
      try {
        await createEnrollment(enrollment);
        enrollmentsSynced += 1;
      } catch (error) {
        errors.push({ enrollment, reason: error.message });
      }
    }

    return res.json({ success: true, enrollmentsSynced, errors });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Enrollment sync failed', error: error.message });
  }
};

// 2. Update LMS configuration (allowed domains or regenerate secret)
export const updateLmsConfig = async (req, res) => {
  const { instituteName, lmsAllowedDomain, regenerateSecret } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { instituteId: true }
    });

    if (!user?.instituteId) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: user.instituteId },
    });

    if (!institute) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    const dataToUpdate = {};
    if (instituteName !== undefined) {
      dataToUpdate.name = instituteName;
    }
    if (lmsAllowedDomain !== undefined) {
      dataToUpdate.lmsAllowedDomain = lmsAllowedDomain;
    }
    if (regenerateSecret) {
      dataToUpdate.lmsSharedSecret = crypto.randomBytes(32).toString('hex');
    }

    const updated = await prisma.institute.update({
      where: { id: institute.id },
      data: dataToUpdate,
    });

    res.json({
      success: true,
      message: 'LMS Configuration updated successfully',
      config: {
        instituteId: updated.id,
        instituteName: updated.name,
        lmsSharedSecret: updated.lmsSharedSecret,
        lmsAllowedDomain: updated.lmsAllowedDomain || '',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Verify public iframe parameters and issue a secure session JWT
export const verifyEmbed = async (req, res) => {
  const { instituteId, email, role } = req.query;

  if (!instituteId || !email || !role) {
    return res.status(400).json({
      success: false,
      message: 'Missing required integration parameters (instituteId, email, role)',
    });
  }

  try {
    // A. Fetch the institute
    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
    });

    if (!institute) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    // B. Find user in the database belonging to this institute
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        instituteId: instituteId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user account found with email "${email}" belonging to institute "${institute.name}". Please register this user first.`,
      });
    }

    // C. Generate a standard JWT auth token for the user session
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '6h' });

    res.json({
      success: true,
      message: 'Integration successfully verified',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions || [],
        instituteId: user.instituteId,
        className: user.className,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
