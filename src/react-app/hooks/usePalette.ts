import { useState } from 'react';

export function usePalette() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePalette = async (
    colorCount: number,
    style: string,
    set?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/palettes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorCount, style, set }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate palette');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateFromImage = async (file: File, colorCount: number = 5) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('colorCount', colorCount.toString());

      const response = await fetch('/api/palettes/from-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate palette from image');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const findEquivalency = async (code: string, brand: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/colors/equivalency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, brand }),
      });

      if (!response.ok) {
        throw new Error('Failed to find color equivalency');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPresets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/palettes/presets');
      if (!response.ok) {
        throw new Error('Failed to fetch presets');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getRecentPalettes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/palettes/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch recent palettes');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generatePalette,
    generateFromImage,
    findEquivalency,
    getPresets,
    getRecentPalettes,
  };
}
