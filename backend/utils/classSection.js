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
