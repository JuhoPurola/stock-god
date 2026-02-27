interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
}

export default function DonutChart({ data, size = 200, thickness = 30 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2;
  const innerRadius = radius - thickness;

  let currentAngle = -90; // Start from top

  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Calculate arc path
    const startRadians = (startAngle * Math.PI) / 180;
    const endRadians = (endAngle * Math.PI) / 180;

    const x1 = radius + radius * Math.cos(startRadians);
    const y1 = radius + radius * Math.sin(startRadians);
    const x2 = radius + radius * Math.cos(endRadians);
    const y2 = radius + radius * Math.sin(endRadians);

    const x1Inner = radius + innerRadius * Math.cos(startRadians);
    const y1Inner = radius + innerRadius * Math.sin(startRadians);
    const x2Inner = radius + innerRadius * Math.cos(endRadians);
    const y2Inner = radius + innerRadius * Math.sin(endRadians);

    const largeArc = angle > 180 ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x2Inner} ${y2Inner}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}`,
      'Z',
    ].join(' ');

    currentAngle = endAngle;

    return {
      path,
      color: item.color,
      label: item.label,
      value: item.value,
      percentage,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={slice.path}
              fill={slice.color}
              className="transition-opacity hover:opacity-80 cursor-pointer"
            />
          </g>
        ))}
      </svg>

      <div className="flex-1 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {slices[index]?.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
