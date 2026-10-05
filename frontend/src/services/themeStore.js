// ==============================================================================
// SKILLNEXUS AI - THEME MANAGEMENT SYSTEM (LIGHT / DARK / SYSTEM MODE)
// ==============================================================================

export const getTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('skillnexus_theme');
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'dark';
};

export const getResolvedTheme = (pref) => {
  const themePref = pref || getTheme();
  if (themePref === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark';
  }
  return themePref === 'light' ? 'light' : 'dark';
};

export const setTheme = (theme) => {
  if (typeof window === 'undefined') return;
  const targetPref = (theme === 'light' || theme === 'dark' || theme === 'system') ? theme : 'dark';
  localStorage.setItem('skillnexus_theme', targetPref);
  
  const effectiveTheme = getResolvedTheme(targetPref);
  const root = document.documentElement;
  
  root.setAttribute('data-theme', effectiveTheme);
  root.setAttribute('data-theme-preference', targetPref);
  
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  window.dispatchEvent(new CustomEvent('nexus_theme_changed', { 
    detail: { 
      theme: effectiveTheme, 
      preference: targetPref 
    } 
  }));
  
  return targetPref;
};

export const toggleTheme = () => {
  const currentPref = getTheme();
  const resolved = getResolvedTheme(currentPref);
  const next = resolved === 'dark' ? 'light' : 'dark';
  return setTheme(next);
};

let systemMediaListener = null;

export const initTheme = () => {
  const initial = getTheme();
  setTheme(initial);

  if (typeof window !== 'undefined' && window.matchMedia && !systemMediaListener) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemMediaListener = (e) => {
      if (getTheme() === 'system') {
        setTheme('system');
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', systemMediaListener);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(systemMediaListener);
    }
  }

  return initial;
};
