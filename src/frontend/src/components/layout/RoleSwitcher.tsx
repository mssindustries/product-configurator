import { useState, useRef, useEffect } from 'react';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';

const roleLabels: Record<UserRole, string> = {
  client: 'Client',
  admin: 'Admin',
};

const roleDescriptions: Record<UserRole, string> = {
  client: 'Customer view for product customization',
  admin: 'Administrative view for management',
};

/**
 * Dropdown component for switching between user roles.
 * Displays current role and allows switching via a dropdown menu.
 */
export function RoleSwitcher() {
  const { role, setRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleRoleSelect = (newRole: UserRole) => {
    setRole(newRole);
    setIsOpen(false);
  };

  const roles: UserRole[] = ['client', 'admin'];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            role === 'admin' ? 'bg-primary-500' : 'bg-success-500'
          )}
        />
        <span>{roleLabels[role]}</span>
        <Icon
          name="chevronDown"
          size="sm"
          className={cn('transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-64 py-1 bg-white rounded-lg shadow-lg',
            'border border-neutral-200 z-50'
          )}
          role="listbox"
          aria-label="Select role"
        >
          {roles.map((roleOption) => (
            <button
              key={roleOption}
              type="button"
              onClick={() => handleRoleSelect(roleOption)}
              className={cn(
                'w-full px-4 py-3 text-left transition-colors',
                'hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none',
                roleOption === role && 'bg-primary-50'
              )}
              role="option"
              aria-selected={roleOption === role}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    roleOption === 'admin' ? 'bg-primary-500' : 'bg-success-500'
                  )}
                />
                <div>
                  <div className="font-medium text-neutral-900">{roleLabels[roleOption]}</div>
                  <div className="text-xs text-neutral-500">{roleDescriptions[roleOption]}</div>
                </div>
                {roleOption === role && (
                  <Icon name="check" size="md" className="ml-auto text-primary-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
