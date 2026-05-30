import { prisma } from '../db.js';
import { validateCoursePayload } from '../utils/validation.js';

// Get all courses (with teacher info)
export const getAllCourses = async (req, res) => {
  try {
    const { className } = req.query;
    const requester = await prisma.user.findUnique({ where: { id: req.userId } });

    const where = {};

    if (className) {
      where.className = className;
    } else if (requester?.role === 'STUDENT') {
      const orFilters = [];
      if (requester.className) {
        orFilters.push({ className: requester.className });
      }
      orFilters.push({ enrollments: { some: { studentId: requester.id } } });
      where.OR = orFilters;
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const { name, code, teacherId, className, days, time } = req.body;

    const dayList = Array.isArray(days) ? days : (days ? days.split(',') : []);
    const validationErrors = validateCoursePayload({ name, code, className, days: dayList });
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors[0] });
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code }
    });

    if (existingCourse) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        ...(teacherId && !isNaN(parseInt(teacherId)) ? { teacher: { connect: { id: parseInt(teacherId) } } } : {}),
        className,
        days: Array.isArray(days) ? days : (days ? days.split(',') : []),
        time,
      },
      include: {
        teacher: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({ success: true, message: 'Course created successfully', course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Update a course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, teacherId, className, days, time } = req.body;

    const courseId = parseInt(id);

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!existingCourse) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const dayList = days !== undefined
      ? (Array.isArray(days) ? days : (days ? days.split(',') : []))
      : existingCourse.days;
    const validationErrors = validateCoursePayload({
      name: name || existingCourse.name,
      code: code || existingCourse.code,
      className: className !== undefined ? className : existingCourse.className,
      days: dayList,
    });
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors[0] });
    }

    // Check if new code conflicts with another course
    if (code && code !== existingCourse.code) {
      const codeConflict = await prisma.course.findUnique({
        where: { code }
      });
      if (codeConflict) {
        return res.status(400).json({ success: false, message: 'Course code already exists' });
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        name: name || existingCourse.name,
        code: code || existingCourse.code,
        ...(teacherId && !isNaN(parseInt(teacherId)) ? { teacher: { connect: { id: parseInt(teacherId) } } } : {}),
        className: className !== undefined ? className : existingCourse.className,
        days: days !== undefined ? (Array.isArray(days) ? days : (days ? days.split(',') : [])) : existingCourse.days,
        time: time !== undefined ? time : existingCourse.time,
      },
      include: {
        teacher: {
          select: { name: true }
        }
      }
    });

    res.json({ success: true, message: 'Course updated successfully', course: updatedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { cascade } = req.query;
    const courseId = parseInt(id);

    console.log(`[BACKEND deleteCourse] Request to delete course ID: ${courseId}, cascade: ${cascade}`);

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true }
    });

    if (!existingCourse) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollmentsCount = await prisma.enrollment.count({
      where: { courseId }
    });
    const attendanceCount = await prisma.attendance.count({
      where: { courseId }
    });

    console.log(`[BACKEND deleteCourse] Course ID ${courseId} has enrollmentsCount: ${enrollmentsCount}, attendanceCount: ${attendanceCount}`);

    // If cascade is not requested and records exist, return requiresCascade true
    if ((enrollmentsCount > 0 || attendanceCount > 0) && cascade !== 'true') {
      console.log(`[BACKEND deleteCourse] Course ID ${courseId} requires cascading. Returning 400 with requiresCascade: true`);
      return res.status(400).json({ 
        success: false, 
        requiresCascade: true,
        message: 'Deleting the course will delete the attendance record!' 
      });
    }

    if (cascade === 'true') {
      console.log(`[BACKEND deleteCourse] Cascading deletion for Course ID ${courseId}...`);
      await prisma.$transaction([
        prisma.attendance.deleteMany({ where: { courseId } }),
        prisma.enrollment.deleteMany({ where: { courseId } }),
        prisma.course.delete({ where: { id: courseId } })
      ]);
      console.log(`[BACKEND deleteCourse] Successfully cascade deleted Course ID ${courseId} and all associated attendance and enrollment records.`);
    } else {
      await prisma.course.delete({
        where: { id: courseId }
      });
      console.log(`[BACKEND deleteCourse] Successfully deleted Course ID ${courseId} (no dependents existed).`);
    }

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error(`[BACKEND deleteCourse] Error deleting course ID ${courseId}:`, error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
