import { z } from "zod";

export const UxGa4FunnelStepSchema = z.object({
  eventName: z.string(),
  eventCount: z.number(),
  activeUsers: z.number(),
});

export const UxGa4DeviceRowSchema = z.object({
  device: z.string(),
  sessions: z.number(),
  activeUsers: z.number(),
  totalRevenue: z.number(),
  ecommercePurchases: z.number(),
  addToCarts: z.number(),
  engagementRate: z.number(),
});

export const UxGa4CityRowSchema = z.object({
  city: z.string(),
  sessions: z.number(),
  activeUsers: z.number(),
  totalRevenue: z.number(),
  ecommercePurchases: z.number(),
  addToCarts: z.number(),
});

export const UxGa4ProductRowSchema = z.object({
  itemName: z.string(),
  itemsViewed: z.number(),
  itemsAddedToCart: z.number(),
  itemRevenue: z.number(),
  itemsPurchased: z.number(),
});

export const UxGa4CustomEventRowSchema = z.object({
  eventName: z.string(),
  eventCount: z.number(),
  activeUsers: z.number(),
});

export const UxGa4BrowserRowSchema = z.object({
  browser: z.string(),
  device: z.string(),
  sessions: z.number(),
  ecommercePurchases: z.number(),
  addToCarts: z.number(),
  totalRevenue: z.number(),
});

export const UxGa4ChannelRowSchema = z.object({
  channel: z.string(),
  sessions: z.number(),
  activeUsers: z.number(),
  ecommercePurchases: z.number(),
  totalRevenue: z.number(),
  addToCarts: z.number(),
});

export const UxGa4FunnelByDeviceRowSchema = z.object({
  eventName: z.string(),
  device: z.string(),
  activeUsers: z.number(),
  eventCount: z.number(),
});

export const UxGa4FunnelByChannelRowSchema = z.object({
  eventName: z.string(),
  channel: z.string(),
  activeUsers: z.number(),
  eventCount: z.number(),
});

export const UxAnalyticsSnapshotPayloadSchema = z.object({
  funnel: z.array(UxGa4FunnelStepSchema),
  devices: z.array(UxGa4DeviceRowSchema),
  cities: z.array(UxGa4CityRowSchema),
  products: z.array(UxGa4ProductRowSchema),
  customEvents: z.array(UxGa4CustomEventRowSchema),
  browsers: z.array(UxGa4BrowserRowSchema).default([]),
  channels: z.array(UxGa4ChannelRowSchema).default([]),
  funnelByDevice: z.array(UxGa4FunnelByDeviceRowSchema).default([]),
  funnelByChannel: z.array(UxGa4FunnelByChannelRowSchema).default([]),
});

export type UxGa4FunnelStep = z.infer<typeof UxGa4FunnelStepSchema>;
export type UxGa4DeviceRow = z.infer<typeof UxGa4DeviceRowSchema>;
export type UxGa4CityRow = z.infer<typeof UxGa4CityRowSchema>;
export type UxGa4ProductRow = z.infer<typeof UxGa4ProductRowSchema>;
export type UxGa4CustomEventRow = z.infer<typeof UxGa4CustomEventRowSchema>;
export type UxGa4BrowserRow = z.infer<typeof UxGa4BrowserRowSchema>;
export type UxGa4ChannelRow = z.infer<typeof UxGa4ChannelRowSchema>;
export type UxGa4FunnelByDeviceRow = z.infer<typeof UxGa4FunnelByDeviceRowSchema>;
export type UxGa4FunnelByChannelRow = z.infer<typeof UxGa4FunnelByChannelRowSchema>;
export type UxAnalyticsSnapshotPayload = z.infer<
  typeof UxAnalyticsSnapshotPayloadSchema
>;

export type UxAnalyticsSnapshot = {
  id: string;
  data_source_id: string;
  period_key: string;
  period_start: string;
  period_end: string;
  recorded_at: string;
} & UxAnalyticsSnapshotPayload;
