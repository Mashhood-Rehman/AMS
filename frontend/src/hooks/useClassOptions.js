import { useEffect, useState } from 'react';
import axios from 'axios';

const FALLBACK_CLASSES = Array.from({ length: 10 }, (_, i) => {
  const name = `Class ${i + 1}`;
  const value = `${name} - Section A`;
  return { label: value, value, className: name, sectionName: 'A' };
});

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
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes/options`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (cancelled) return;

        if (response.data.success) {
          const apiOptions = response.data.options || [];
          if (apiOptions.length > 0) {
            setOptions(apiOptions.map((o) => ({ label: o.label, value: o.value })));
            setClasses(response.data.classes || []);
          } else {
            setOptions(FALLBACK_CLASSES.map((o) => ({ label: o.label, value: o.value })));
            setClasses([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load classes');
          setOptions(FALLBACK_CLASSES.map((o) => ({ label: o.label, value: o.value })));
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
