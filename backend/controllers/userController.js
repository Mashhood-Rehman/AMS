import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

const REQUIRED_PERMISSIONS = ['dashboard', 'edit-profile'];

// Create User (Admin creates student/teacher)
export const createUser = async (req, res) => {
  const { email, password, name, role, phone, courseIds, instituteId, permissions, className } = req.body;

  try {
    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Role validation
    const validRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
    if (role && !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const creator = await prisma.user.findUnique({ where: { id: req.userId } });

    let targetInstituteId = instituteId || null;
    if (creator?.role !== 'ADMIN') {
      targetInstituteId = creator?.instituteId || targetInstituteId;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: (role || 'STUDENT').toUpperCase(),
        ...(targetInstituteId ? { institute: { connect: { id: targetInstituteId } } } : {}),
        createdBy: req.userId,
        taughtCourses: role === 'TEACHER' && courseIds ? {
          connect: courseIds.map(id => ({ id: parseInt(id) }))
        } : undefined,
        permissions: Array.from(new Set([...(permissions || []), ...REQUIRED_PERMISSIONS])),
        className: role === 'STUDENT' ? className : null
      },
      include: { taughtCourses: true }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: user.id, email: user.email, name: user.name, role: user.role, instituteId: user.instituteId, permissions: user.permissions, className: user.className }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Edit User
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, name, role, phone, courseIds, instituteId, permissions, className } = req.body;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
    if (role && !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const updateData = {
      email: email || targetUser.email,
      name: name || targetUser.name,
      phone: phone !== undefined ? phone : targetUser.phone,
      role: role ? role.toUpperCase() : targetUser.role,
      ...(instituteId ? { institute: { connect: { id: instituteId } } } : {}),
      permissions: permissions !== undefined 
        ? { set: Array.from(new Set([...permissions, ...REQUIRED_PERMISSIONS])) } 
        : undefined,
      className: className !== undefined ? className : targetUser.className,
    };

    if (updateData.role === 'TEACHER' && courseIds) {
      updateData.taughtCourses = {
        set: courseIds.map(id => ({ id: parseInt(id) }))
      };
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role, instituteId: updatedUser.instituteId, permissions: updatedUser.permissions }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Email address already in use' });
    }
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, courseId, instituteId: filterInstituteId, className: filterClassName } = req.query;

    const requester = await prisma.user.findUnique({ where: { id: req.userId } });

    const where = {};
    if (role) where.role = role.toUpperCase();
    if (filterClassName) where.className = filterClassName;

    if (requester.role === 'STUDENT') {
      if (requester.className) {
        where.className = requester.className;
      } else {
        where.id = requester.id;
      }
    } else if (requester.role === 'TEACHER') {
      where.instituteId = requester.instituteId;
    } else if (filterInstituteId) {
      where.instituteId = filterInstituteId;
    }

    let courseClassName = null;
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        select: { className: true }
      });
      courseClassName = course?.className;
      console.log(`[getAllUsers] courseId=${courseId} courseClassName=${courseClassName}`);

      const enrollmentFilter = {
        enrollments: {
          some: {
            courseId: parseInt(courseId)
          }
        }
      };

      const courseFilter = courseClassName ? { OR: [enrollmentFilter, { className: courseClassName }] } : enrollmentFilter;
      if (requester.role === 'STUDENT') {
        where.AND = [...(where.AND || []), courseFilter];
      } else {
        Object.assign(where, courseFilter);
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        instituteId: true,
        taughtCourses: {
          select: { id: true, name: true, code: true }
        },
        permissions: true,
        className: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await prisma.$transaction(async (prismaTx) => {

      // Remove teacher from courses
      if (targetUser.role === 'TEACHER') {
        await prismaTx.course.updateMany({
          where: { teacherId: userId },
          data: { teacherId: null }
        });

        // DELETE teacher attendance records
        await prismaTx.teacherAttendance.deleteMany({
          where: { teacherId: userId }
        });
      }

      // Delete student-related records
      await prismaTx.alert.deleteMany({
        where: { studentId: userId }
      });

      await prismaTx.attendance.deleteMany({
        where: { studentId: userId }
      });

      await prismaTx.enrollment.deleteMany({
        where: { studentId: userId }
      });

      // Finally delete user
      await prismaTx.user.delete({
        where: { id: userId }
      });
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get role-based real-time dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const role = user.role;
    const stats = {};

    if (role === 'ADMIN') {
      stats.totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
      stats.activeCourses = await prisma.course.count();
      stats.totalTeachers = await prisma.user.count({ where: { role: 'TEACHER' } });
      stats.totalInstitutes = await prisma.institute.count();
    } else if (role === 'TEACHER') {
      const instituteId = user.instituteId || '';
      stats.totalStudents = await prisma.user.count({
        where: { role: 'STUDENT', instituteId }
      });
      stats.activeCourses = await prisma.course.count({
        where: { teacherId: user.id }
      });
      stats.totalTeachers = await prisma.user.count({
        where: { role: 'TEACHER', instituteId }
      });
    } else if (role === 'STUDENT') {
      const className = user.className || '';
      stats.activeCourses = await prisma.course.count({
        where: {
          className: className
        }
      });
    }

    res.json({ success: true, role, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};