import { useState, useCallback } from "react";

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

export function useLoadingState<T = any>(initialData: T = null as T) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData,
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: isLoading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: initialData });
  }, [initialData]);

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setLoading(true);
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
      throw error;
    }
  }, [setLoading, setData, setError]);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset,
    execute,
  };
}
