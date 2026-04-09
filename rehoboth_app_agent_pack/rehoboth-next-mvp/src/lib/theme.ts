export type AppTheme = "light" | "dark";

export const themeStorageKey = "rehoboth.theme.v1";
export const themeStorageEvent = "rehoboth-theme-storage";

export const themeInitScript = `(() => {
  const storageKey = ${JSON.stringify(themeStorageKey)};
  let theme = "light";

  try {
    const storedTheme = window.localStorage.getItem(storageKey);

    if (storedTheme === "light" || storedTheme === "dark") {
      theme = storedTheme;
    }
  } catch {}

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();`;

export function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey);

    if (storedTheme === "dark") {
      return "dark";
    }
  } catch {}

  return "light";
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function writeStoredTheme(theme: AppTheme) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {}

  applyTheme(theme);
  window.dispatchEvent(new Event(themeStorageEvent));
}

export function subscribeStoredTheme(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleThemeChange = () => callback();
  window.addEventListener("storage", handleThemeChange);
  window.addEventListener(themeStorageEvent, handleThemeChange);

  return () => {
    window.removeEventListener("storage", handleThemeChange);
    window.removeEventListener(themeStorageEvent, handleThemeChange);
  };
}
