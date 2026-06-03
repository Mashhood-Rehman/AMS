import { prisma } from '../db.js';
import { seedInstituteClasses, syncMissingNumberedClasses } from '../utils/seedInstituteClasses.js';
import {
  formatClassSectionName,
  normalizeClassName,
  normalizeSectionName,
} from '../utils/classSection.js';

const resolveInstituteId = async (req, bodyInstituteId) => {
  const requester = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { role: true, instituteId: true },
  });

  const queryInstituteId = req.query?.instituteId;

  if (requester?.role === 'ADMIN') {
    const explicit = bodyInstituteId || queryInstituteId;
    if (explicit) return explicit;
    if (requester.instituteId) return requester.instituteId;
    const firstInstitute = await prisma.institute.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return firstInstitute?.id || null;
  }

  return requester?.instituteId || null;
};

const classInclude = {
  sections: { orderBy: { name: 'asc' } },
};

const ensureInstituteClasses = async (instituteId) => {
  const institute = await prisma.institute.findUnique({
    where: { id: instituteId },
    select: { maxClass: true },
  });
  const maxClass = institute?.maxClass || 0;
  if (maxClass <= 0) return;

  const count = await prisma.academicClass.count({ where: { instituteId } });
  if (count === 0) {
    await seedInstituteClasses(instituteId, maxClass);
    return;
  }

  await syncMissingNumberedClasses(instituteId, maxClass);
};

const mapClassResponse = (academicClass) => ({
  ...academicClass,
  sectionOptions: (academicClass.sections || []).map((section) => ({
    sectionId: section.id,
    sectionName: section.name,
    value: formatClassSectionName(academicClass.name, section.name),
    label: formatClassSectionName(academicClass.name, section.name),
  })),
});

export const getClassOptions = async (req, res) => {
  try {
    const instituteId = await resolveInstituteId(req, req.query.instituteId);
    if (!instituteId) {
      return res.json({ success: true, options: [], classes: [] });
    }

    await ensureInstituteClasses(instituteId);

    const classes = await prisma.academicClass.findMany({
      where: { instituteId },
      include: classInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const options = classes.flatMap((academicClass) =>
      (academicClass.sections || []).map((section) => ({
        value: formatClassSectionName(academicClass.name, section.name),
        label: formatClassSectionName(academicClass.name, section.name),
        classId: academicClass.id,
        sectionId: section.id,
        className: academicClass.name,
        sectionName: section.name,
      }))
    );

    res.json({
      success: true,
      options,
      classes: classes.map(mapClassResponse),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const instituteId = await resolveInstituteId(req, req.query.instituteId);
    if (!instituteId) {
      return res.json({ success: true, classes: [] });
    }

    await ensureInstituteClasses(instituteId);

    const classes = await prisma.academicClass.findMany({
      where: { instituteId },
      include: classInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, classes: classes.map(mapClassResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const instituteId = await resolveInstituteId(req);
    const academicClass = await prisma.academicClass.findFirst({
      where: { id: req.params.id, ...(instituteId ? { instituteId } : {}) },
      include: classInclude,
    });

    if (!academicClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    res.json({ success: true, class: mapClassResponse(academicClass) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createClass = async (req, res) => {
  try {
    const { name, sections, sortOrder, instituteId: bodyInstituteId } = req.body;
    const instituteId = await resolveInstituteId(req, bodyInstituteId);

    if (!instituteId) {
      return res.status(400).json({ success: false, message: 'Institute is required to create a class' });
    }

    const className = normalizeClassName(name);
    if (!className) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    const sectionNames = Array.isArray(sections)
      ? [...new Set(sections.map(normalizeSectionName).filter(Boolean))]
      : [];

    if (sectionNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Add at least one section (e.g. A, B, or Morning)',
      });
    }

    const academicClass = await prisma.academicClass.create({
      data: {
        instituteId,
        name: className,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
        sections: {
          create: sectionNames.map((sectionName) => ({ name: sectionName })),
        },
      },
      include: classInclude,
    });

    res.status(201).json({
      success: true,
      message: 'Class created with sections',
      class: mapClassResponse(academicClass),
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A class with this name already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sections, sortOrder } = req.body;
    const instituteId = await resolveInstituteId(req);

    const existing = await prisma.academicClass.findFirst({
      where: { id, ...(instituteId ? { instituteId } : {}) },
      include: { sections: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const className = name !== undefined ? normalizeClassName(name) : existing.name;
    if (!className) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.academicClass.update({
        where: { id },
        data: {
          name: className,
          ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) } : {}),
        },
      });

      if (Array.isArray(sections)) {
        const sectionNames = [...new Set(sections.map(normalizeSectionName).filter(Boolean))];
        if (sectionNames.length === 0) {
          throw new Error('At least one section is required');
        }

        await tx.classSection.deleteMany({ where: { academicClassId: id } });
        await tx.classSection.createMany({
          data: sectionNames.map((sectionName) => ({
            academicClassId: id,
            name: sectionName,
          })),
        });
      }
    });

    const updated = await prisma.academicClass.findUnique({
      where: { id },
      include: classInclude,
    });

    res.json({
      success: true,
      message: 'Class updated',
      class: mapClassResponse(updated),
    });
  } catch (error) {
    if (error.message === 'At least one section is required') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Duplicate class or section name' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const instituteId = await resolveInstituteId(req);

    const existing = await prisma.academicClass.findFirst({
      where: { id, ...(instituteId ? { instituteId } : {}) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    await prisma.academicClass.delete({ where: { id } });

    res.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
