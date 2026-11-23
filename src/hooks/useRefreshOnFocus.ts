import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

// Refetches when the tab regains focus, not on the first mount (the queries already load then): FR-011.
export function useRefreshOnFocus(refetch: () => unknown) {
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else refetch();
    }, [refetch]),
  );
}
