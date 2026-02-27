import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAlertStore } from '../../store/alert-store';
import { AlertDropdown } from './AlertDropdown';
import clsx from 'clsx';

export function AlertBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { unreadCount, fetchUnreadCount, fetchAlerts } = useAlertStore();

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    // Refresh every 30 seconds as a fallback to WebSocket
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch alerts when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchAlerts({ unreadOnly: false });
    }
  }, [isOpen, fetchAlerts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'relative p-2 rounded-lg transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          isOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 text-xs bg-danger-600 text-white rounded-full font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <AlertDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
}
