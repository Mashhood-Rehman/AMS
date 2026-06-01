import { prisma } from '../db.js';
import { seedInstituteClasses } from '../utils/seedInstituteClasses.js';

// Create Institute
export const createInstitute = async (req, res) => {
  const { name, maxClass, address, phone } = req.body;

  try {
    if (!name || !maxClass) {
      return res.status(400).json({ success: false, message: 'Name and max class are required' });
    }

    const parsedMaxClass = parseInt(maxClass, 10);
    const institute = await prisma.institute.create({
      data: {
        name,
        maxClass: parsedMaxClass,
        address,
        phone
      }
    });

    await seedInstituteClasses(institute.id, parsedMaxClass);

    res.status(201).json({
      success: true,
      message: 'Institute created successfully',
      institute
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
// Get All Institutes
export const getAllInstitutes = async (req, res) => {
  try {
    const requester = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, instituteId: true }
    });

    if (requester?.role === 'STUDENT') {
      if (!requester.instituteId) {
        return res.json({ success: true, institutes: [] });
      }
      const institute = await prisma.institute.findUnique({
        where: { id: requester.instituteId },
        include: {
          _count: {
            select: { users: true, courses: true }
          }
        }
      });
      return res.json({ success: true, institutes: institute ? [institute] : [] });
    }

    const institutes = await prisma.institute.findMany({
      include: {
        _count: {
          select: { users: true, courses: true }
        }
      }
    });
    res.json({ success: true, institutes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Single Institute
export const getInstituteById = async (req, res) => {
  const { id } = req.params;
  try {
    const institute = await prisma.institute.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, role: true, email: true }
        }
      }
    });


    res.json({ success: true, institute });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Institute
export const updateInstitute = async (req, res) => {
  console.log('Update Institute Request Body:', req.body);
  const { id } = req.params;
  const { name, maxClass, address, phone } = req.body;

  try {
    const updateData = {
      name,
      maxClass: maxClass !== undefined ? parseInt(maxClass) : undefined,
      address,
      phone
    };

    const institute = await prisma.institute.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, institute });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Institute
export const deleteInstitute = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.institute.delete({ where: { id } });
    res.json({ success: true, message: 'Institute deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
