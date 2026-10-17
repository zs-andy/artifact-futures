type ThemeLock = "light" | "dark";

export function themeLockAttrs(lock: ThemeLock = "light") {
  return { "data-theme-locked": lock, "data-theme": lock };
}
