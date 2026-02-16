import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-sm border border-gray-200',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ children, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
}

export function CardContent({ children }: CardContentProps) {
  return <div>{children}</div>;
}
