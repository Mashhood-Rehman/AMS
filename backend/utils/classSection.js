/** Full label stored on User.className and Course.className (e.g. "Class 5 - Section A"). */
export function formatClassSectionName(className, sectionName) {
  const cls = String(className || '').trim();
  const sec = String(sectionName || '').trim();
  if (!cls) return sec;
  if (!sec) return cls;
  const sectionLabel = /^section\s/i.test(sec) ? sec : `Section ${sec}`;
  return `${cls} - ${sectionLabel}`;
}

export function normalizeSectionName(name) {
  return String(name || '').trim();
}

export function normalizeClassName(name) {
  return String(name || '').trim();
}

/** Base grade label from a full class+section value (e.g. "Class 5 - Section A" → "Class 5"). */
export function getBaseClassName(classLabel) {
  const trimmed = String(classLabel || '').trim();
  if (!trimmed) return '';
  const dash = trimmed.indexOf(' - ');
  return dash === -1 ? trimmed : trimmed.slice(0, dash).trim();
}

/** Prisma where clause: match courses for a class dropdown value (exact, legacy base, or section variants). */
export function buildCourseClassNameWhere(classLabel) {
  const trimmed = String(classLabel || '').trim();
  if (!trimmed) return null;
  const baseClass = getBaseClassName(trimmed);
  return {
    OR: [
      { className: trimmed },
      { className: baseClass },
      { className: { startsWith: `${baseClass} -` } },
    ],
  };
}
