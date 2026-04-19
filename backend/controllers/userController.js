import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

// Create User (Admin/Teacher creates student/user)
export const createUser = async (req, res) => {
  const { email, password, name, role } = req.body;

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: (role || 'STUDENT').toUpperCase(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Edit User
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, name, role } = req.body;

  try {
    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role validation
    const validRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
    if (role && !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Prepare update data
    const updateData = {
      email: email || targetUser.email,
      name: name || targetUser.name,
      role: role ? role.toUpperCase() : targetUser.role,
    };

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
      user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role }
    });
  } catch (error) {
    // Handle email conflict during update
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Email address already in use' });
    }
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
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
