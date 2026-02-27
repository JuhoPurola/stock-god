import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/theme-store';
import { useState, useRef, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const getCurrentIcon = () => {
    const option = themeOptions.find(o => o.value === theme);
    return option ? option.icon : Sun;
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <div className="relative" ref={menuRef}>
      {/* Quick Toggle Button (for simple dark/light toggle) */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Dropdown Menu (optional, for system theme option) */}
      {/*
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Change theme"
        aria-label="Change theme"
      >
        <CurrentIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setShowMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  theme === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
      */}
    </div>
  );
}
