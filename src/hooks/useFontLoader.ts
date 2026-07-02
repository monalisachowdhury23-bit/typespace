import { useEffect } from 'react';
import { FONT_LOADING_MAP, getAllFontNames } from '../data/fonts';

export function useFontLoader() {
  useEffect(() => {
    const allNames = getAllFontNames();

    const googleIds: string[] = [];
    const fontshareIds: string[] = [];

    allNames.forEach(name => {
      const entry = FONT_LOADING_MAP[name];
      if (!entry) return;
      if (entry.source === 'google') googleIds.push(entry.id);
      else fontshareIds.push(entry.id);
    });

    // Google Fonts — batch single link
    if (googleIds.length) {
      const params = googleIds.map(id => `family=${id}:wght@400;500;600`).join('&');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
      document.head.appendChild(link);
    }

    // Fontshare — batch single link
    if (fontshareIds.length) {
      const params = fontshareIds.map(id => `f[]=${id}@400,500,700`).join('&');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://api.fontshare.com/v2/css?${params}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);
}
