import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  animateOnChange?: boolean;
}

export default function AnimatedCounter({
  value,
  duration = 500,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  animateOnChange = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!animateOnChange || value === prevValueRef.current) {
      setDisplayValue(value);
      return;
    }

    setIsAnimating(true);
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        prevValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration, animateOnChange]);

  const formattedValue = displayValue.toFixed(decimals);

  return (
    <span
      className={`${className} ${isAnimating ? 'text-blue-600 dark:text-blue-400' : ''} transition-colors duration-200`}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}
