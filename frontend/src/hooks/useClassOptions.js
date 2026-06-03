import { useEffect, useState } from 'react';
import { api } from '../api';

function getLoggedInInstituteId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.instituteId || null;
  } catch {
    return null;
  }
}

/** Build dropdown rows from /classes/options payload (no artificial limit). */
function mapApiOptions(data) {
  const direct = data?.options || [];
  if (direct.length > 0) {
    return direct.map((o) => ({ label: o.label, value: o.value }));
  }

  return (data?.classes || []).flatMap((academicClass) => {
    if (academicClass.sectionOptions?.length) {
      return academicClass.sectionOptions.map((o) => ({
        label: o.label,
        value: o.value,
      }));
    }
    return (academicClass.sections || []).map((section) => {
      const sec = section.name || '';
      const sectionLabel = /^section\s/i.test(sec) ? sec : `Section ${sec}`;
      const value = `${academicClass.name} - ${sectionLabel}`;
      return { label: value, value };
    });
  });
}

export function useClassOptions() {
  const [options, setOptions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const instituteId = getLoggedInInstituteId();
        const params = instituteId ? { instituteId } : {};
        const data = await api.getClassOptions(params);
        if (cancelled) return;

        if (data.success) {
          const mapped = mapApiOptions(data);
          setOptions(mapped);
          setClasses(data.classes || []);
          if (mapped.length === 0) {
            setError('No classes found. Add classes from the Classes page.');
          }
        } else {
          setOptions([]);
          setClasses([]);
          setError(data.message || 'Could not load classes');
        }
      } catch (err) {
        if (!cancelled) {
          setOptions([]);
          setClasses([]);
          setError(err.message || 'Could not load classes');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, classes, loading, error };
}

export default useClassOptions;
