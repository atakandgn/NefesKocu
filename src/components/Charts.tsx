import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  Path,
  Circle,
} from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");

interface ChartDataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  barColor?: string;
  labelColor?: string;
  title?: string;
  unit?: string;
  noDataText?: string;
}

export function BarChart({
  data,
  height = 160,
  barColor = "#22d3ee",
  labelColor = "#9ca3af",
  title,
  unit = "",
  noDataText = "Henüz veri yok",
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>{noDataText}</Text>
      </View>
    );
  }

  const chartWidth = screenWidth - 64;
  const chartHeight = height - 40;
  const barWidth = (chartWidth - 20) / data.length - 8;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 20, bottom: 30, left: 10, right: 10 };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <Svg width={chartWidth} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * (1 - ratio);
          return (
            <Line
              key={i}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#2E2E2E"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = padding.left + index * (barWidth + 8) + 4;
          const y = padding.top + chartHeight - barHeight;

          return (
            <React.Fragment key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={barColor}
                opacity={0.9}
              />
              <SvgText
                x={x + barWidth / 2}
                y={height - 8}
                fill={labelColor}
                fontSize={10}
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
              {item.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 6}
                  fill="#FFFFFF"
                  fontSize={10}
                  textAnchor="middle"
                >
                  {`${item.value} ${unit}`}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  lineColor?: string;
  fillColor?: string;
  labelColor?: string;
  title?: string;
  showDots?: boolean;
  noDataText?: string;
}

export function LineChart({
  data,
  height = 160,
  lineColor = "#4ade80",
  fillColor = "rgba(74, 222, 128, 0.1)",
  labelColor = "#9ca3af",
  title,
  showDots = true,
  noDataText = "Henüz veri yok",
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>{noDataText}</Text>
      </View>
    );
  }

  const chartWidth = screenWidth - 64;
  const chartHeight = height - 40;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;
  const padding = { top: 20, bottom: 30, left: 10, right: 10 };
  const pointSpacing =
    (chartWidth - padding.left - padding.right) / (data.length - 1 || 1);

  // Generate path
  const points = data.map((item, index) => {
    const x = padding.left + index * pointSpacing;
    const y =
      padding.top +
      chartHeight -
      ((item.value - minValue) / range) * chartHeight;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    padding.top + chartHeight
  } L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <Svg width={chartWidth} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * (1 - ratio);
          return (
            <Line
              key={i}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#2E2E2E"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Area fill */}
        <Path d={areaPath} fill={fillColor} />

        {/* Line */}
        <Path d={linePath} stroke={lineColor} strokeWidth={2} fill="none" />

        {/* Dots */}
        {showDots &&
          points.map((p, index) => (
            <Circle
              key={index}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={lineColor}
              stroke="#121212"
              strokeWidth={2}
            />
          ))}

        {/* Labels - only show some to avoid crowding */}
        {data.map((item, index) => {
          if (data.length <= 7 || index % Math.ceil(data.length / 7) === 0) {
            return (
              <SvgText
                key={index}
                x={padding.left + index * pointSpacing}
                y={height - 8}
                fill={labelColor}
                fontSize={10}
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            );
          }
          return null;
        })}
      </Svg>
    </View>
  );
}

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  title?: string;
  noDataText?: string;
}

export function PieChart({ data, size = 120, title, noDataText = "Henüz veri yok" }: PieChartProps) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <View style={[styles.container, { height: size + 40 }]}>
        <Text style={styles.noDataText}>{noDataText}</Text>
      </View>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -90; // Start from top

  const slices = data.map((item) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData =
      data.length === 1
        ? `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${
            centerX - 0.001
          } ${centerY - radius} Z`
        : `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      path: pathData,
      color: item.color,
      label: item.label,
      percentage: Math.round(percentage * 100),
    };
  });

  return (
    <View style={styles.pieContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.pieRow}>
        <Svg width={size} height={size}>
          {slices.map((slice, index) => (
            <Path key={index} d={slice.path} fill={slice.color} />
          ))}
          {/* Center circle for donut effect */}
          <Circle cx={centerX} cy={centerY} r={radius * 0.5} fill="#121212" />
        </Svg>
        <View style={styles.pieLegend}>
          {slices.slice(0, 5).map((slice, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: slice.color }]}
              />
              <Text style={styles.legendText} numberOfLines={1}>
                {slice.label}
              </Text>
              <Text style={styles.legendPercent}>{slice.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  value?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color = "#22d3ee",
  backgroundColor = "#2E2E2E",
  label,
  value,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.progressRingContainer}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.progressRingContent, { width: size, height: size }]}>
        {value && <Text style={styles.progressRingValue}>{value}</Text>}
      </View>
      {label && <Text style={styles.progressRingLabel}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  chartTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  noDataText: {
    color: "#6b7280",
    fontSize: 14,
  },
  pieContainer: {
    alignItems: "center",
  },
  pieRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pieLegend: {
    marginLeft: 16,
    flex: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    color: "#FFFFFF",
    fontSize: 12,
    flex: 1,
  },
  legendPercent: {
    color: "#9ca3af",
    fontSize: 12,
    marginLeft: 8,
  },
  progressRingContainer: {
    alignItems: "center",
  },
  progressRingContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  progressRingLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});
