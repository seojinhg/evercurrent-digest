import { useState } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.error('localStorage read error:', err);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error('localStorage write error:', err);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (err) {
      console.error('localStorage remove error:', err);
    }
  };

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;