
export interface SummaryMetric {
  label: string;
  value: string | number;
  color?: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface CustomQuery {
  id: string;
  name: string;
  sql: string;
  type: 'card' | 'bar' | 'pie' | 'line' | 'table';
  orientation?: 'vertical' | 'horizontal';
  color?: string;
  colors?: string[];
  headerBgColor?: string;
  headerTextColor?: string;
  valueColor?: string;
  labelKey?: string;
  valueKey?: string;
  description?: string;
  isRounded?: boolean;
  isStacked?: boolean;
  stackKeys?: string[];
  gridSpan?: number;
  rowSpan?: number;
  height?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  titleFontSize?: number;
  valueFontSize?: number;
  xAxisLabelAngle?: number;
  barSize?: number;
}

export interface LayoutCell {
  id: string;
  queryIds: string[];
  gridSpan?: number;
}

export interface PageRow {
  id: string;
  columnCount: number;
  cells: LayoutCell[];
  height?: number;
}

export interface CustomPage {
  id: string;
  name: string;
  icon: string;
  queryIds: string[];
  columns?: number;
  rowHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
  layout?: PageRow[];
  fileName?: string;
}

export enum Page {
  HOME = 'home',
  SETTINGS = 'settings',
  DIAGNOSTICS = 'diagnostics',
  DATABASE_EXPLORER = 'database_explorer'
}

export type SettingsTab = 'general' | 'queries' | 'pages' | 'builder' | 'database' | 'diagnostics' | 'clients' | 'scheduling';
