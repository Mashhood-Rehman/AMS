import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

// Create User (Admin/Principal creates student/teacher)
export const createUser = async (req, res) => {
  const { email, password, name, role, phone, status, courseIds, instituteId } = req.body;

  try {
    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Role validation
    const validRoles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'];
    if (role && !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Get the creator's info
    const creator = await prisma.user.findUnique({ where: { id: req.userId } });

    // Logic for instituteId:
    // If Admin creates a Principal, they might provide an instituteId or it might be set later.
    // If a Principal creates a Teacher/Student, we use the Principal's instituteId.
    let targetInstituteId = instituteId ? parseInt(instituteId) : null;
    if (creator.role === 'PRINCIPAL') {
      targetInstituteId = creator.instituteId;
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
        status: status || 'ACTIVE',
        role: (role || 'STUDENT').toUpperCase(),
        instituteId: targetInstituteId,
        createdBy: req.userId,
        taughtCourses: (role === 'TEACHER' || role === 'PRINCIPAL') && courseIds ? {
          connect: courseIds.map(id => ({ id: parseInt(id) }))
        } : undefined
      },
      include: { taughtCourses: true }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: user.id, email: user.email, name: user.name, role: user.role, instituteId: user.instituteId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Edit User
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, name, role, phone, status, courseIds, instituteId } = req.body;

  try {
    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role validation
    const validRoles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'];
    if (role && !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Prepare update data
    const updateData = {
      email: email || targetUser.email,
      name: name || targetUser.name,
      phone: phone !== undefined ? phone : targetUser.phone,
      status: status || targetUser.status,
      role: role ? role.toUpperCase() : targetUser.role,
      instituteId: instituteId ? parseInt(instituteId) : targetUser.instituteId,
    };

    // Update teacher/principal courses
    if ((updateData.role === 'TEACHER' || updateData.role === 'PRINCIPAL') && courseIds) {
      updateData.taughtCourses = {
        set: courseIds.map(id => ({ id: parseInt(id) }))
      };
    }

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role, instituteId: updatedUser.instituteId }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Email address already in use' });
    }
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get All Users (with optional filters)
export const getAllUsers = async (req, res) => {
  try {
    const { role, courseId, status, instituteId: filterInstituteId } = req.query;

    // Get the requester's info to scope results
    const requester = await prisma.user.findUnique({ where: { id: req.userId } });

    const where = {};
    if (role) where.role = role.toUpperCase();
    if (status) where.status = status.toUpperCase();
    
    // Scope by Institute
    if (requester.role === 'PRINCIPAL') {
      where.instituteId = requester.instituteId;
    } else if (filterInstituteId) {
      where.instituteId = parseInt(filterInstituteId);
    }

    // If courseId is provided, filter students enrolled in that course
    if (courseId) {
      where.enrollments = {
        some: {
          courseId: parseInt(courseId)
        }
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        instituteId: true,
        taughtCourses: {
          select: { id: true, name: true, code: true }
        },
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

// Delete User
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
