interface LiveIndicatorProps {
  isLive: boolean;
  className?: string;
}

export default function LiveIndicator({ isLive, className = '' }: LiveIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full ${
            isLive ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
        {isLive && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>
      <span
        className={`text-xs font-medium ${
          isLive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {isLive ? 'LIVE' : 'Offline'}
      </span>
    </div>
  );
}
