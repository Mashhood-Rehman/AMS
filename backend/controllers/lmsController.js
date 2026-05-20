import { prisma } from '../db.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// 1. Get LMS configuration for the logged-in user
// Re-generated client loaded
export const getLmsConfig = async (req, res) => {

  try {
    console.log('[getLmsConfig] User requesting config. User ID:', req.userId);

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { instituteId: true }
    });

    if (!user?.instituteId) {
      console.warn(`[getLmsConfig] No instituteId found for user ID: ${req.userId}`);
      return res.status(404).json({
        success: false,
        message: 'No institute associated with this user account. Please assign an institute first.',
      });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: user.instituteId },
    });

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

// 2. Update LMS configuration (allowed domains or regenerate secret)
export const updateLmsConfig = async (req, res) => {
  const { lmsAllowedDomain, regenerateSecret } = req.body;

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
