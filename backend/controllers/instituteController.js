import { prisma } from '../db.js';

// Create Institute
export const createInstitute = async (req, res) => {
  const { name, classesOffered, address, phone, principalId } = req.body;

  try {
    if (!name || !classesOffered || !principalId) {
      return res.status(400).json({ success: false, message: 'Name, classes offered, and principal are required' });
    }

    const principal = await prisma.user.findUnique({ where: { id: parseInt(principalId) } });
    if (!principal || principal.role !== 'PRINCIPAL') {
      return res.status(400).json({ success: false, message: 'A valid Principal user must be selected' });
    }

    const existingInstitute = await prisma.institute.findUnique({ where: { principalId: parseInt(principalId) } });
    if (existingInstitute) {
      return res.status(400).json({ success: false, message: 'This Principal is already assigned to another institute' });
    }

    const institute = await prisma.institute.create({
      data: {
        name,
        classesOffered,
        address,
        phone,
        principalId: parseInt(principalId)
      }
    });

    await prisma.user.update({
      where: { id: parseInt(principalId) },
      data: { instituteId: institute.id }
    });

    res.status(201).json({
      success: true,
      message: 'Institute created and Principal assigned successfully',
      institute
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get All Institutes
export const getAllInstitutes = async (req, res) => {
  try {
    const institutes = await prisma.institute.findMany({
      include: {
        principal: {
          select: { id: true, name: true, email: true }
        },
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
      where: { id: parseInt(id) },
      include: {
        principal: {
          select: { id: true, name: true, email: true, phone: true }
        },
        users: {
          select: { id: true, name: true, role: true, email: true }
        }
      }
    });

    if (!institute) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    res.json({ success: true, institute });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Institute
export const updateInstitute = async (req, res) => {
  const { id } = req.params;
  const { name, classesOffered, address, phone, principalId } = req.body;

  try {
    const updateData = {
      name,
      classesOffered,
      address,
      phone
    };

    if (principalId) {
      updateData.principalId = parseInt(principalId);

      // If principal changes, we need to handle the instituteId updates
      // This is a complex case, but for now we'll just update the field
      // and assume the user knows what they're doing.
    }

    const institute = await prisma.institute.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    if (principalId) {
      await prisma.user.update({
        where: { id: parseInt(principalId) },
        data: { instituteId: institute.id }
      });
    }

    res.json({ success: true, institute });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Institute
export const deleteInstitute = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.institute.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Institute deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
