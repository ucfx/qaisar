import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export type FetchOptions = RequestInit;

type UseFetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export const useFetch = <T>(url: string, options?: FetchOptions): UseFetchResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (url === '') {
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          const d = await response.json();
          throw new Error(`${d.message}`);
        }

        const result: T = await response.json();
        setData(result);
      } catch (err: any) {
        console.log(err)
        const errorMessage = err.message || 'Something went wrong';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, options]);

  return { data, loading, error };
};
