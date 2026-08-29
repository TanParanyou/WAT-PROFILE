export interface TrackPageViewPayload {
  path: string;
  locale?: string;
  resource_type?: string;
  resource_id?: string | number;
  referrer?: string;
}

export interface TrendDataPoint {
  date: string;
  views: number;
  unique_visitors: number;
}

export interface AnalyticsOverview {
  total_views: number;
  unique_visitors: number;
  today_views: number;
  today_unique_visitors: number;
  period_views: number;
  period_unique_visitors: number;
  device_breakdown: Record<string, number>;
  locale_breakdown: Record<string, number>;
  resource_type_breakdown: Record<string, number>;
  trends: TrendDataPoint[];
}

export interface TopResourceItem {
  resource_type: string;
  resource_id: string;
  path: string;
  views: number;
  unique_visitors: number;
  title?: string;
}

export interface ResourceStats {
  resource_type: string;
  resource_id: string;
  total_views: number;
  unique_visitors: number;
  locale_breakdown: Record<string, number>;
  device_breakdown: Record<string, number>;
  daily_trends: TrendDataPoint[];
}
