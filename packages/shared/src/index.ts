import { z } from "zod";

export const IntegrationServiceSchema = z.enum([
  "search_console",
  "analytics",
  "google_ads",
  "google_business",
  "tag_manager",
  "merchant_center",
  "youtube_analytics",
  "page_speed",
  "google_indexing",
  "crux_history",
  "meta_ads",
  "tiktok_ads",
  "tiktok_organic",
  "google_trends",
  "dataforseo",
  "moz",
  "seomonitor",
  "semrush",
  "ahrefs",
  "wordpress",
  "framer",
]);

export type IntegrationService = z.infer<typeof IntegrationServiceSchema>;

/** Curated product readiness for the integrations catalog, not per-user connection state. */
export type IntegrationSetupStatus = "live" | "needs_config" | "coming_soon";

export const IntegrationProviderSchema = z.enum([
  "google",
  "meta",
  "tiktok",
  "seo",
  "cms",
]);
export type IntegrationProvider = z.infer<typeof IntegrationProviderSchema>;

export type IntegrationCapability =
  | "metrics"
  | "discover"
  | "rank_tracking"
  | "site_audit"
  | "publish"
  | "crawl"
  | "indexing";

export function getConnectionProvider(
  service: IntegrationService,
): IntegrationProvider {
  if (service === "meta_ads") return "meta";
  if (service === "tiktok_ads" || service === "tiktok_organic") return "tiktok";
  if (
    service === "dataforseo" ||
    service === "moz" ||
    service === "seomonitor" ||
    service === "semrush" ||
    service === "ahrefs"
  ) {
    return "seo";
  }
  if (service === "wordpress" || service === "framer") return "cms";
  return "google";
}

const PPC_SERVICES = ["google_ads", "meta_ads", "tiktok_ads"] as const;
export type PpcIntegrationService = (typeof PPC_SERVICES)[number];

export function isPpcService(
  service: IntegrationService,
): service is PpcIntegrationService {
  return (PPC_SERVICES as readonly string[]).includes(service);
}

export const INTEGRATION_SERVICES: {
  id: IntegrationService;
  name: string;
  description: string;
  available: boolean;
  setupStatus: IntegrationSetupStatus;
  tags: string[];
}[] = [
  {
    id: "search_console",
    name: "Google Search Console",
    description:
      "Monitor search performance, indexing status, and queries for your ecommerce site.",
    available: true,
    setupStatus: "live",
    tags: ["SEO"],
  },
  {
    id: "analytics",
    name: "Google Analytics",
    description:
      "Track revenue, conversions, and traffic sources across your store.",
    available: true,
    setupStatus: "live",
    tags: ["PPC", "Revenue"],
  },
  {
    id: "google_ads",
    name: "Google Ads",
    description:
      "Understand paid campaign performance alongside organic and store data.",
    available: true,
    setupStatus: "live",
    tags: ["PPC"],
  },
  {
    id: "google_business",
    name: "Google Business Profile",
    description:
      "Monitor local visibility, profile views, and customer actions on Maps and Search.",
    available: true,
    setupStatus: "live",
    tags: ["SEO", "Social Media"],
  },
  {
    id: "tag_manager",
    name: "Google Tag Manager",
    description:
      "Track container health, published versions, and tag/trigger inventory across sites.",
    available: true,
    setupStatus: "live",
    tags: ["Technical"],
  },
  {
    id: "merchant_center",
    name: "Google Merchant Center",
    description:
      "Monitor product feed health, disapprovals, and account issues for Shopping listings.",
    available: true,
    setupStatus: "live",
    tags: ["SEO", "PPC"],
  },
  {
    id: "youtube_analytics",
    name: "YouTube Analytics",
    description: "Monitor video views, watch time, and channel growth.",
    available: true,
    setupStatus: "live",
    tags: ["Social Media"],
  },
  {
    id: "page_speed",
    name: "Google PageSpeed Insights",
    description:
      "Track Core Web Vitals and page performance scores for monitored URLs.",
    available: true,
    setupStatus: "needs_config",
    tags: ["Technical", "SEO"],
  },
  {
    id: "google_indexing",
    name: "Google Indexing API",
    description:
      "Publish URL update notifications and track indexing status for verified sites.",
    available: true,
    setupStatus: "live",
    tags: ["SEO", "Technical"],
  },
  {
    id: "crux_history",
    name: "Chrome UX Report (CrUX)",
    description:
      "Track origin-level Core Web Vitals history from the CrUX History API.",
    available: true,
    setupStatus: "needs_config",
    tags: ["Technical", "SEO"],
  },
  {
    id: "tiktok_organic",
    name: "TikTok Organic",
    description:
      "Track organic TikTok video performance, views, and engagement for connected profiles.",
    available: true,
    setupStatus: "needs_config",
    tags: ["Social Media"],
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    description:
      "Track Facebook and Instagram ad spend, reach, and conversions.",
    available: true,
    setupStatus: "needs_config",
    tags: ["Social Media", "PPC"],
  },
  {
    id: "tiktok_ads",
    name: "TikTok Ads",
    description:
      "Monitor TikTok ad spend, impressions, clicks, and conversions across advertisers.",
    available: true,
    setupStatus: "needs_config",
    tags: ["Social Media", "PPC"],
  },
  {
    id: "google_trends",
    name: "Google Trends",
    description:
      "Track keyword interest over time. Alpha-gated: requires official Google Trends API access — no data until Google grants access.",
    available: true,
    setupStatus: "coming_soon",
    tags: ["SEO"],
  },
  {
    id: "dataforseo",
    name: "DataForSEO",
    description:
      "Agency SERP, rank tracking, and crawl data powered by the shared DataForSEO account.",
    available: true,
    setupStatus: "needs_config",
    tags: ["SEO"],
  },
  {
    id: "moz",
    name: "Moz",
    description:
      "Domain authority, spam score, and site metrics from your Moz Pro API token.",
    available: true,
    setupStatus: "live",
    tags: ["SEO"],
  },
  {
    id: "seomonitor",
    name: "SEOmonitor",
    description:
      "Campaign visibility, keyword rankings, and share of voice from SEOmonitor.",
    available: true,
    setupStatus: "live",
    tags: ["SEO"],
  },
  {
    id: "semrush",
    name: "SEMrush",
    description:
      "Domain ranks, organic visibility, and competitive metrics via your SEMrush API key.",
    available: true,
    setupStatus: "live",
    tags: ["SEO"],
  },
  {
    id: "ahrefs",
    name: "Ahrefs",
    description:
      "Backlink and domain overview metrics. Connect with an API token until OAuth is available.",
    available: true,
    setupStatus: "live",
    tags: ["SEO"],
  },
  {
    id: "wordpress",
    name: "WordPress",
    description:
      "Publish blog posts and drafts to client WordPress sites via the REST API and Application Passwords.",
    available: true,
    setupStatus: "needs_config",
    tags: ["CMS publish"],
  },
  {
    id: "framer",
    name: "Framer",
    description:
      "Push content to Framer CMS collections. Server API integration is in preview — connect stores credentials for when publish is enabled.",
    available: true,
    setupStatus: "needs_config",
    tags: ["CMS publish"],
  },
];

export const SEO_INTEGRATION_SERVICES = [
  "dataforseo",
  "moz",
  "seomonitor",
  "semrush",
  "ahrefs",
] as const satisfies readonly IntegrationService[];

export type SeoIntegrationService = (typeof SEO_INTEGRATION_SERVICES)[number];

export function isSeoIntegrationService(
  service: IntegrationService,
): service is SeoIntegrationService {
  return (SEO_INTEGRATION_SERVICES as readonly string[]).includes(service);
}

export const CMS_INTEGRATION_SERVICES = [
  "wordpress",
  "framer",
] as const satisfies readonly IntegrationService[];

export type CmsIntegrationService = (typeof CMS_INTEGRATION_SERVICES)[number];

export function isCmsIntegrationService(
  service: IntegrationService,
): service is CmsIntegrationService {
  return (CMS_INTEGRATION_SERVICES as readonly string[]).includes(service);
}

export const COMING_SOON_INTEGRATIONS: {
  id: string;
  name: string;
  description: string;
  tags: string[];
}[] = [
  {
    id: "shopify",
    name: "Shopify",
    description:
      "Technical SEO, collections, and page SEO for scalable Shopify storefronts.",
    tags: ["Ecommerce", "Technical SEO"],
  },
  {
    id: "webflow",
    name: "Webflow",
    description:
      "CMS SEO, landing pages, and content structure for Webflow sites.",
    tags: ["CMS", "SEO"],
  },
  {
    id: "magento",
    name: "Magento",
    description:
      "Enterprise ecommerce SEO for complex catalogs, filters, categories, and indexation.",
    tags: ["Ecommerce", "Technical SEO"],
  },
  {
    id: "wix_ecommerce",
    name: "Wix eCommerce",
    description:
      "Local and on-page SEO for Wix stores, product pages, and structured data.",
    tags: ["Ecommerce", "Local SEO"],
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    description:
      "Technical and B2B SEO for scalable BigCommerce storefronts.",
    tags: ["Ecommerce", "B2B SEO"],
  },
  {
    id: "squarespace_commerce",
    name: "Squarespace Commerce",
    description:
      "Brand, content, and visual-page SEO for Squarespace commerce sites.",
    tags: ["Ecommerce", "Content SEO"],
  },
  {
    id: "drupal",
    name: "Drupal",
    description:
      "Content architecture, taxonomy, technical SEO, and scalable page management.",
    tags: ["CMS", "Technical SEO"],
  },
  {
    id: "vtex",
    name: "VTEX",
    description:
      "Enterprise marketplace and omnichannel SEO for large catalogs and storefronts.",
    tags: ["Ecommerce", "Enterprise SEO"],
  },
  {
    id: "opencart",
    name: "OpenCart",
    description:
      "URL, metadata, category, and lightweight technical SEO for OpenCart stores.",
    tags: ["Ecommerce", "Technical SEO"],
  },
  {
    id: "merchantpro",
    name: "MerchantPro",
    description:
      "Romanian ecommerce SEO for categories, products, feed URLs, and tracking.",
    tags: ["Ecommerce", "Romania"],
  },
];

export type SyncStatus = "idle" | "syncing" | "error";

export const GoogleConnectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  service: IntegrationServiceSchema,
  account_email: z.string().email(),
  site_url: z.string().nullable(),
  property_id: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}),
  authorized_by_user_id: z.string().uuid().nullable().optional(),
  oauth_client_key: z.string().optional(),
  authorization_status: z
    .enum(["connected", "reauth_required", "revoked", "error"])
    .optional(),
  last_token_refresh_error_code: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GoogleConnection = z.infer<typeof GoogleConnectionSchema>;

export const ProviderConnectionSchema = GoogleConnectionSchema.extend({
  provider: IntegrationProviderSchema,
});

export type ProviderConnection = z.infer<typeof ProviderConnectionSchema>;

export const WatchlistEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  connection_id: z.string().uuid(),
  label: z.string().nullable(),
  is_pinned: z.boolean(),
  created_at: z.string(),
  connection: GoogleConnectionSchema.optional(),
});

export type WatchlistEntry = z.infer<typeof WatchlistEntrySchema>;

export const AddToWatchlistSchema = z.object({
  connection_id: z.string().uuid(),
  label: z.string().optional(),
});

export type AddToWatchlistInput = z.infer<typeof AddToWatchlistSchema>;

export const AnalyticsOverviewSchema = z.object({
  sessions: z.number(),
  activeUsers: z.number(),
  keyEvents: z.number(),
  totalRevenue: z.number(),
  purchases: z.number(),
  periodDays: z.number(),
  propertyId: z.string(),
});

export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;

export const SearchConsoleSnapshotSchema = z.object({
  clicks: z.number(),
  impressions: z.number(),
  ctr: z.number(),
  position: z.number(),
  periodDays: z.number(),
});

export type SearchConsoleSnapshot = z.infer<typeof SearchConsoleSnapshotSchema>;

export const GoogleAdsSnapshotSchema = z.object({
  clicks: z.number(),
  impressions: z.number(),
  cost: z.number(),
  conversions: z.number(),
  periodDays: z.number(),
  customerId: z.string(),
  currencyCode: z.string(),
});

export type GoogleAdsSnapshot = z.infer<typeof GoogleAdsSnapshotSchema>;

export const GoogleBusinessSnapshotSchema = z.object({
  impressions: z.number(),
  websiteClicks: z.number(),
  callClicks: z.number(),
  directionRequests: z.number(),
  periodDays: z.number(),
  locationId: z.string(),
});

export type GoogleBusinessSnapshot = z.infer<typeof GoogleBusinessSnapshotSchema>;

export const TagManagerSnapshotSchema = z.object({
  tagsCount: z.number(),
  triggersCount: z.number(),
  variablesCount: z.number(),
  publishedVersionId: z.string().nullable(),
  containerId: z.string(),
  publicId: z.string().nullable(),
});

export type TagManagerSnapshot = z.infer<typeof TagManagerSnapshotSchema>;

export const MerchantCenterSnapshotSchema = z.object({
  merchantId: z.string(),
  totalProducts: z.number(),
  activeProducts: z.number(),
  disapprovedProducts: z.number(),
  pendingProducts: z.number(),
  accountIssuesCount: z.number(),
});

export type MerchantCenterSnapshot = z.infer<typeof MerchantCenterSnapshotSchema>;

export const YouTubeAnalyticsSnapshotSchema = z.object({
  channelId: z.string(),
  channelTitle: z.string(),
  subscriberCount: z.number(),
  totalViews: z.number(),
  videoCount: z.number(),
  views: z.number(),
  watchTimeMinutes: z.number(),
  subscribersGained: z.number(),
  likes: z.number(),
  comments: z.number(),
});

export type YouTubeAnalyticsSnapshot = z.infer<
  typeof YouTubeAnalyticsSnapshotSchema
>;

export const PageSpeedSnapshotSchema = z.object({
  performanceScore: z.number(),
  accessibilityScore: z.number().optional(),
  lcpMs: z.number(),
  cls: z.number(),
  inpMs: z.number().optional(),
  strategy: z.enum(["mobile", "desktop"]),
  url: z.string().url(),
});

export type PageSpeedSnapshot = z.infer<typeof PageSpeedSnapshotSchema>;

export const AddPageSpeedUrlSchema = z.object({
  url: z.string().min(1),
});

export type AddPageSpeedUrlInput = z.infer<typeof AddPageSpeedUrlSchema>;

export const GoogleIndexingSnapshotSchema = z.object({
  siteUrl: z.string(),
  urlsWithUpdate: z.number(),
  urlsWithRemoval: z.number(),
  latestNotifyTime: z.string().nullable(),
});

export type GoogleIndexingSnapshot = z.infer<typeof GoogleIndexingSnapshotSchema>;

export const CruxHistorySnapshotSchema = z.object({
  origin: z.string().url(),
  formFactor: z.enum(["PHONE", "DESKTOP", "ALL_FORM_FACTORS"]),
  lcpP75: z.number(),
  clsP75: z.number(),
  inpP75: z.number().optional(),
  fcpP75: z.number(),
  ttfbP75: z.number(),
  collectionPeriods: z.number(),
});

export type CruxHistorySnapshot = z.infer<typeof CruxHistorySnapshotSchema>;

export const AddCruxHistoryUrlSchema = z.object({
  url: z.string().min(1),
});

export type AddCruxHistoryUrlInput = z.infer<typeof AddCruxHistoryUrlSchema>;

export const TikTokOrganicSnapshotSchema = z.object({
  openId: z.string(),
  displayName: z.string(),
  followerCount: z.number(),
  videoCount: z.number(),
  views: z.number(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number(),
  profileViews: z.number(),
  periodDays: z.number(),
});

export type TikTokOrganicSnapshot = z.infer<typeof TikTokOrganicSnapshotSchema>;

export const ConnectWordPressSchema = z.object({
  siteUrl: z.string().min(1),
  username: z.string().min(1),
  appPassword: z.string().min(1),
  clientId: z.string().uuid().optional(),
  label: z.string().max(120).optional(),
});

export type ConnectWordPressInput = z.infer<typeof ConnectWordPressSchema>;

export const ConnectFramerSchema = z.object({
  projectUrl: z.string().min(1),
  apiKey: z.string().min(8),
  clientId: z.string().uuid().optional(),
  label: z.string().max(120).optional(),
});

export type ConnectFramerInput = z.infer<typeof ConnectFramerSchema>;

export const CmsPublishStatusSchema = z.enum(["draft", "publish"]);

export const CmsPublishSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  status: CmsPublishStatusSchema.default("draft"),
  credentialId: z.string().uuid().optional(),
});

export type CmsPublishInput = z.infer<typeof CmsPublishSchema>;

export const IntegrationCredentialSafeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  client_id: z.string().uuid().nullable(),
  provider: z.literal("cms"),
  service: z.enum(["wordpress", "framer"]),
  auth_type: z.enum(["api_key", "app_password"]),
  label: z.string().nullable(),
  site_url: z.string().nullable(),
  config: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type IntegrationCredentialSafe = z.infer<
  typeof IntegrationCredentialSafeSchema
>;

export const CmsPublishLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  client_id: z.string().uuid(),
  credential_id: z.string().uuid().nullable(),
  service: z.string(),
  draft_title: z.string().nullable(),
  remote_post_id: z.string().nullable(),
  remote_url: z.string().nullable(),
  status: z.enum(["queued", "success", "failed"]),
  error_message: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}),
  pushed_at: z.string(),
});

export type CmsPublishLog = z.infer<typeof CmsPublishLogSchema>;

export const SeoIntegrationConnectSchema = z.object({
  token: z.string().min(1).optional(),
  apiKey: z.string().min(1).optional(),
  siteUrl: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
});

export type SeoIntegrationConnectInput = z.infer<
  typeof SeoIntegrationConnectSchema
>;

export const IntegrationCredentialSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  client_id: z.string().uuid().nullable(),
  provider: IntegrationProviderSchema,
  service: IntegrationServiceSchema,
  auth_type: z.enum(["oauth", "api_key", "user_token", "app_password"]),
  label: z.string().nullable(),
  site_url: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type IntegrationCredential = z.infer<typeof IntegrationCredentialSchema>;

export const MetaAdsSnapshotSchema = z.object({
  clicks: z.number(),
  impressions: z.number(),
  spend: z.number(),
  conversions: z.number(),
  periodDays: z.number(),
  adAccountId: z.string(),
  currencyCode: z.string(),
});

export type MetaAdsSnapshot = z.infer<typeof MetaAdsSnapshotSchema>;

export const TikTokAdsSnapshotSchema = z.object({
  clicks: z.number(),
  impressions: z.number(),
  spend: z.number(),
  conversions: z.number(),
  periodDays: z.number(),
  advertiserId: z.string(),
  currencyCode: z.string(),
});

export type TikTokAdsSnapshot = z.infer<typeof TikTokAdsSnapshotSchema>;

export const IntegrationSyncResultSchema = z.object({
  service: IntegrationServiceSchema,
  synced: z.number(),
  failed: z.number(),
  skipped: z.number(),
  lastSyncAt: z.string(),
  errors: z
    .array(
      z.object({
        connectionId: z.string().uuid(),
        message: z.string(),
      }),
    )
    .optional(),
});

export type IntegrationSyncResult = z.infer<typeof IntegrationSyncResultSchema>;

export const UpdateIntegrationSettingsSchema = z.object({
  integration_enabled: z.boolean().optional(),
  enabled_operations: z
    .array(
      z.enum([
        "sync_metrics",
        "sync_metadata",
        "discover",
        "publish",
        "indexing",
      ]),
    )
    .optional(),
  connections: z
    .array(
      z.object({
        id: z.string().uuid(),
        monitoring_enabled: z.boolean(),
        sync_period_days: z.number().min(7).max(90).optional(),
        exclude_today: z.boolean().optional(),
      }),
    )
    .optional(),
});

export type UpdateIntegrationSettingsInput = z.infer<
  typeof UpdateIntegrationSettingsSchema
>;

export const DisconnectIntegrationAccountSchema = z.object({
  accountEmail: z.string().trim().min(1).max(320),
});

export type DisconnectIntegrationAccountInput = z.infer<
  typeof DisconnectIntegrationAccountSchema
>;

export function isConnectionMonitoringEnabled(
  metadata: Record<string, unknown>,
): boolean {
  return metadata.monitoring_enabled !== false;
}

/** When true (default), sync ends on yesterday so metrics match GA4 finalized daily data. */
export function isSyncExcludeToday(metadata: Record<string, unknown>): boolean {
  return metadata.exclude_today !== false;
}

export function getSyncPeriodDays(metadata: Record<string, unknown>): number {
  const days = Number(metadata.sync_period_days);
  if (days === 7 || days === 28 || days === 90) {
    return days;
  }
  return 28;
}

export function syncPeriodDaysToPeriodKey(days: number): PeriodKey {
  if (days <= 7) return "7d";
  if (days <= 28) return "28d";
  return "90d";
}

export function isIntegrationEnabled(metadata: Record<string, unknown>): boolean {
  return metadata.enabled !== false;
}

export function getServiceLabel(service: IntegrationService): string {
  const match = INTEGRATION_SERVICES.find((item) => item.id === service);
  return match?.name ?? service;
}

export function getConnectionDisplayName(connection: GoogleConnection): string {
  if (connection.site_url) {
    return connection.site_url;
  }

  const displayName = connection.metadata.display_name;
  if (typeof displayName === "string" && displayName) {
    return displayName;
  }

  if (connection.property_id) {
    if (connection.service === "google_ads") {
      return (
        (typeof connection.metadata.display_name === "string" &&
          connection.metadata.display_name) ||
        `Google Ads ${connection.property_id}`
      );
    }
    if (connection.service === "google_business") {
      return (
        (typeof connection.metadata.display_name === "string" &&
          connection.metadata.display_name) ||
        `Business location ${connection.property_id}`
      );
    }
    if (connection.service === "tag_manager") {
      return (
        (typeof connection.metadata.public_id === "string" &&
          connection.metadata.public_id) ||
        (typeof connection.metadata.display_name === "string" &&
          connection.metadata.display_name) ||
        `GTM container ${connection.property_id}`
      );
    }
    if (connection.service === "merchant_center") {
      return (
        (typeof connection.metadata.display_name === "string" &&
          connection.metadata.display_name) ||
        `Merchant Center ${connection.property_id}`
      );
    }
    if (connection.service === "page_speed" || connection.service === "crux_history") {
      return connection.site_url ?? connection.account_email;
    }
    if (connection.service === "google_indexing") {
      return connection.site_url ?? `Indexing ${connection.account_email}`;
    }
    if (connection.service === "meta_ads") {
      return (
        (typeof connection.metadata.display_name === "string" &&
          connection.metadata.display_name) ||
        `Meta Ads account ${connection.property_id}`
      );
    }
    if (connection.service === "tiktok_ads") {
      return (
        (typeof connection.metadata.display_name === "string" &&
          connection.metadata.display_name) ||
        `TikTok advertiser ${connection.property_id}`
      );
    }
    if (connection.service === "tiktok_organic") {
      return (
        (typeof connection.metadata.display_name === "string" &&
          connection.metadata.display_name) ||
        `TikTok profile ${connection.property_id}`
      );
    }
    return `GA4 property ${connection.property_id}`;
  }

  return connection.account_email;
}

export const UserRoleSchema = z.enum(["admin", "manager", "staff"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const PermissionKeySchema = z.enum([
  "dashboard",
  "integrations",
  "portfolio",
  "admin",
  "manual_sync",
  "clients_view_all",
  "clients_manage",
  "seo_view",
  "seo_manage",
  "seo_manual_sync",
]);
export type PermissionKey = z.infer<typeof PermissionKeySchema>;

export const PeriodKeySchema = z.enum(["7d", "28d", "90d"]);
export type PeriodKey = z.infer<typeof PeriodKeySchema>;

export const SyncIntervalSchema = z.enum(["daily", "weekly"]);
export type SyncInterval = z.infer<typeof SyncIntervalSchema>;

export const UserPermissionsSchema = z.record(PermissionKeySchema, z.boolean());
export type UserPermissions = Partial<Record<PermissionKey, boolean>>;

export const PERMISSION_GROUPS: {
  id: string;
  label: string;
  description: string;
  permissions: { key: PermissionKey; label: string }[];
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Permission settings for dashboard",
    permissions: [{ key: "dashboard", label: "View" }],
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Permission settings for integrations",
    permissions: [{ key: "integrations", label: "View" }],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Permission settings for portfolio and clients",
    permissions: [
      { key: "portfolio", label: "View portfolio" },
      { key: "clients_view_all", label: "View all clients" },
      { key: "clients_manage", label: "Manage clients and data sources" },
    ],
  },
  {
    id: "sync",
    label: "Sync",
    description: "Permission settings for metric sync",
    permissions: [
      { key: "manual_sync", label: "Trigger portfolio sync" },
      { key: "seo_manual_sync", label: "Trigger SEO sync" },
    ],
  },
  {
    id: "seo",
    label: "SEO",
    description: "Permission settings for SEO workspace",
    permissions: [
      { key: "seo_view", label: "View SEO data" },
      { key: "seo_manage", label: "Manage categories, keywords, and competitors" },
    ],
  },
  {
    id: "admin",
    label: "Members & Roles",
    description: "Permission settings for members and roles",
    permissions: [{ key: "admin", label: "Manage members and roles" }],
  },
];

export const PERMISSION_DEFINITIONS: {
  key: PermissionKey;
  label: string;
  description: string;
}[] = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => ({
    key: permission.key,
    label: permission.label,
    description: group.description,
  })),
);

export const RoleLimitsSchema = z.object({
  seo_manual_sync_daily: z.number().int().nonnegative().nullable().optional(),
});

export type RoleLimits = z.infer<typeof RoleLimitsSchema>;

export const AppRoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  permissions: z
    .object({
      dashboard: z.boolean().optional(),
      integrations: z.boolean().optional(),
      portfolio: z.boolean().optional(),
      admin: z.boolean().optional(),
      manual_sync: z.boolean().optional(),
      clients_view_all: z.boolean().optional(),
      clients_manage: z.boolean().optional(),
      seo_view: z.boolean().optional(),
      seo_manage: z.boolean().optional(),
      seo_manual_sync: z.boolean().optional(),
    })
    .default({}),
  limits: RoleLimitsSchema.default({}),
  is_system: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AppRole = z.infer<typeof AppRoleSchema>;

export const UserRoleAssignmentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  role_id: z.string().uuid(),
  assigned_by: z.string().uuid().nullable(),
  created_at: z.string(),
  role: AppRoleSchema.optional(),
  assigned_by_profile: z
    .object({
      full_name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .optional(),
});

export type UserRoleAssignment = z.infer<typeof UserRoleAssignmentSchema>;

export const ApprovalStatusSchema = z.enum([
  "pending",
  "pending_on_hold",
  "approved",
  "rejected",
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const DEFAULT_EMAIL_MONTHLY_LIMIT = 3000;
export const EMAIL_QUOTA_WARNING_REMAINING = 200;

export const EmailQuotaSummarySchema = z.object({
  monthKey: z.string(),
  sent: z.number(),
  limit: z.number(),
  remaining: z.number(),
  isExceeded: z.boolean(),
  isNearLimit: z.boolean(),
});

export type EmailQuotaSummary = z.infer<typeof EmailQuotaSummarySchema>;

export const ManagedUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  email: z.string().email().nullable(),
  is_system_admin: z.boolean(),
  approval_status: ApprovalStatusSchema,
  approval_reviewed_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  roles: z.array(AppRoleSchema),
  assignments: z.array(UserRoleAssignmentSchema),
});

export type ManagedUser = z.infer<typeof ManagedUserSchema>;

export const RoleWithMembersSchema = AppRoleSchema.extend({
  member_count: z.number(),
  members: z.array(
    z.object({
      id: z.string().uuid(),
      full_name: z.string().nullable(),
      email: z.string().nullable(),
    }),
  ),
});

export type RoleWithMembers = z.infer<typeof RoleWithMembersSchema>;

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<PermissionKey, boolean>> =
  {
    admin: {
      dashboard: true,
      integrations: true,
      portfolio: true,
      admin: true,
      manual_sync: true,
      clients_view_all: true,
      clients_manage: true,
      seo_view: true,
      seo_manage: true,
      seo_manual_sync: true,
    },
    manager: {
      dashboard: true,
      integrations: true,
      portfolio: true,
      admin: false,
      manual_sync: true,
      clients_view_all: true,
      clients_manage: false,
      seo_view: true,
      seo_manage: false,
      seo_manual_sync: true,
    },
    staff: {
      dashboard: true,
      integrations: true,
      portfolio: true,
      admin: false,
      manual_sync: false,
      clients_view_all: false,
      clients_manage: false,
      seo_view: true,
      seo_manage: false,
      seo_manual_sync: false,
    },
  };

export const DEFAULT_SEO_MANUAL_SYNC_DAILY = 2;

export const EMPTY_PERMISSIONS: Record<PermissionKey, boolean> = {
  dashboard: false,
  integrations: false,
  portfolio: false,
  admin: false,
  manual_sync: false,
  clients_view_all: false,
  clients_manage: false,
  seo_view: false,
  seo_manage: false,
  seo_manual_sync: false,
};

export function slugifyRoleName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function mergeRolePermissions(
  roles: Pick<AppRole, "permissions">[],
): Record<PermissionKey, boolean> {
  return PERMISSION_DEFINITIONS.reduce(
    (resolved, definition) => {
      resolved[definition.key] = roles.some(
        (role) => Boolean(role.permissions?.[definition.key]),
      );
      return resolved;
    },
    { ...EMPTY_PERMISSIONS },
  );
}

export function sanitizeRolePermissions(
  permissions: UserPermissions = {},
): Record<PermissionKey, boolean> {
  return PERMISSION_DEFINITIONS.reduce(
    (result, definition) => {
      result[definition.key] = Boolean(permissions[definition.key]);
      return result;
    },
    { ...EMPTY_PERMISSIONS },
  );
}

export function resolveSeoManualSyncDailyLimit(
  roles: Pick<AppRole, "limits">[],
  isSystemAdmin = false,
): number | null {
  if (isSystemAdmin) {
    return null;
  }

  const configured = roles
    .map((role) => role.limits?.seo_manual_sync_daily)
    .filter((value) => value !== undefined);

  if (configured.some((value) => value === null)) {
    return null;
  }

  if (configured.length === 0) {
    return DEFAULT_SEO_MANUAL_SYNC_DAILY;
  }

  return Math.max(...configured.map((value) => value ?? 0));
}

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  email: z.string().email().nullable(),
  role: UserRoleSchema,
  is_system_admin: z.boolean().default(false),
  approval_status: ApprovalStatusSchema.default("pending"),
  approval_reviewed_at: z.string().nullable().optional(),
  preferred_locale: z.enum(["ro", "en"]).default("ro"),
  preferred_currency: z.string().length(3).default("RON"),
  permissions: z
    .object({
      dashboard: z.boolean().optional(),
      integrations: z.boolean().optional(),
      portfolio: z.boolean().optional(),
      admin: z.boolean().optional(),
      manual_sync: z.boolean().optional(),
      clients_view_all: z.boolean().optional(),
      clients_manage: z.boolean().optional(),
      seo_view: z.boolean().optional(),
      seo_manage: z.boolean().optional(),
      seo_manual_sync: z.boolean().optional(),
    })
    .default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Admin",
    manager: "Manager",
    staff: "Staff",
  };
  return labels[role] ?? role;
}

// --- Client & Portfolio ---

export const ClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Client = z.infer<typeof ClientSchema>;

export const ClientDataSourceSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  connection_id: z.string().uuid(),
  provider: IntegrationProviderSchema.default("google"),
  service: IntegrationServiceSchema,
  label: z.string().nullable(),
  is_enabled: z.boolean(),
  sync_enabled: z.boolean(),
  added_by: z.string().uuid(),
  added_by_name: z.string().nullable(),
  added_by_email: z.string().email().nullable(),
  source_name: z.string().nullable(),
  created_at: z.string(),
  connection: GoogleConnectionSchema.optional(),
});

export type ClientDataSource = z.infer<typeof ClientDataSourceSchema>;

export const CreateClientSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export const AssignDataSourceSchema = z.object({
  client_id: z.string().uuid(),
  connection_id: z.string().uuid(),
  label: z.string().optional(),
});

export type AssignDataSourceInput = z.infer<typeof AssignDataSourceSchema>;

export const SeoKeywordSourceSchema = z.enum([
  "manual",
  "gsc",
  "competitor",
  "suggested",
]);
export type SeoKeywordSource = z.infer<typeof SeoKeywordSourceSchema>;

export const SeoKeywordStatusSchema = z.enum(["tracking", "suggested", "archived"]);
export type SeoKeywordStatus = z.infer<typeof SeoKeywordStatusSchema>;

export const ClientWebsiteSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  name: z.string(),
  domain: z.string(),
  gsc_connection_id: z.string().uuid().nullable(),
  is_primary: z.boolean(),
  last_seo_sync_at: z.string().nullable(),
  seo_sync_error: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ClientWebsite = z.infer<typeof ClientWebsiteSchema>;

export const SeoCategorySchema = z.object({
  id: z.string().uuid(),
  website_id: z.string().uuid(),
  name: z.string(),
  sort_order: z.number(),
  created_at: z.string(),
});

export type SeoCategory = z.infer<typeof SeoCategorySchema>;

export const SeoKeywordSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  keyword: z.string(),
  source: SeoKeywordSourceSchema,
  status: SeoKeywordStatusSchema,
  created_at: z.string(),
});

export type SeoKeyword = z.infer<typeof SeoKeywordSchema>;

export const SeoQuerySnapshotSchema = z.object({
  id: z.string().uuid(),
  website_id: z.string().uuid(),
  query: z.string(),
  page_url: z.string().nullable(),
  clicks: z.number(),
  impressions: z.number(),
  ctr: z.number(),
  position: z.number(),
  period_key: PeriodKeySchema,
  period_start: z.string(),
  period_end: z.string(),
  recorded_at: z.string(),
});

export type SeoQuerySnapshot = z.infer<typeof SeoQuerySnapshotSchema>;

export const SeoCompetitorSchema = z.object({
  id: z.string().uuid(),
  website_id: z.string().uuid(),
  domain: z.string(),
  label: z.string().nullable(),
  sitemap_url: z.string().nullable(),
  last_crawled_at: z.string().nullable(),
  crawl_error: z.string().nullable(),
  created_at: z.string(),
});

export type SeoCompetitor = z.infer<typeof SeoCompetitorSchema>;

export const SeoCompetitorPageSchema = z.object({
  id: z.string().uuid(),
  competitor_id: z.string().uuid(),
  url: z.string(),
  path: z.string().nullable(),
  title: z.string().nullable(),
  h1: z.string().nullable(),
  fetched_at: z.string(),
});

export type SeoCompetitorPage = z.infer<typeof SeoCompetitorPageSchema>;

export const CreateClientWebsiteSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  domain: z.string().min(1).max(255),
  gsc_connection_id: z.string().uuid().optional(),
  is_primary: z.boolean().optional(),
});

export type CreateClientWebsiteInput = z.infer<typeof CreateClientWebsiteSchema>;

export const CreateSeoCategorySchema = z.object({
  website_id: z.string().uuid(),
  name: z.string().min(1).max(120),
});

export type CreateSeoCategoryInput = z.infer<typeof CreateSeoCategorySchema>;

export const CreateSeoKeywordSchema = z.object({
  category_id: z.string().uuid(),
  keyword: z.string().min(1).max(255),
});

export type CreateSeoKeywordInput = z.infer<typeof CreateSeoKeywordSchema>;

export const CreateSeoCompetitorSchema = z.object({
  website_id: z.string().uuid(),
  domain: z.string().min(1).max(255),
  label: z.string().max(120).optional(),
  sitemap_url: z.string().url().optional(),
});

export type CreateSeoCompetitorInput = z.infer<typeof CreateSeoCompetitorSchema>;

export const MetricSnapshotSchema = z.object({
  id: z.string().uuid(),
  data_source_id: z.string().uuid(),
  period_key: PeriodKeySchema,
  metric_key: z.string(),
  value: z.number(),
  currency: z.string().nullable(),
  previous_value: z.number().nullable(),
  recorded_at: z.string(),
  period_start: z.string(),
  period_end: z.string(),
});

export type MetricSnapshot = z.infer<typeof MetricSnapshotSchema>;

export const SyncLogSchema = z.object({
  id: z.string().uuid(),
  data_source_id: z.string().uuid().nullable(),
  service: z.string().nullable(),
  status: z.enum(["started", "success", "error", "skipped"]),
  message: z.string().nullable(),
  triggered_by: z.string().uuid().nullable(),
  trigger_type: z.enum(["scheduled", "manual"]),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}),
});

export type SyncLog = z.infer<typeof SyncLogSchema>;

export const SyncJobTypeSchema = z.enum([
  "portfolio",
  "integration",
  "connection_group",
  "seo",
  "discover",
  "publish",
]);
export type SyncJobType = z.infer<typeof SyncJobTypeSchema>;

export const SyncJobStatusSchema = z.enum([
  "queued",
  "running",
  "retrying",
  "success",
  "completed",
  "failed",
  "cancelled",
]);
export type SyncJobStatus = z.infer<typeof SyncJobStatusSchema>;

export const SyncJobSchema = z.object({
  id: z.string().uuid(),
  job_type: SyncJobTypeSchema,
  provider: z.string().nullable(),
  service: z.string().nullable(),
  connection_id: z.string().uuid().nullable(),
  client_id: z.string().uuid().nullable(),
  user_id: z.string().uuid().nullable(),
  status: SyncJobStatusSchema,
  priority: z.number(),
  attempts: z.number(),
  max_attempts: z.number(),
  payload: z.record(z.unknown()).default({}),
  result: z.record(z.unknown()).default({}),
  error_message: z.string().nullable(),
  error_code: z.string().nullable().optional(),
  locked_at: z.string().nullable(),
  locked_by: z.string().nullable(),
  queue: z.string().optional(),
  operation: z.string().nullable().optional(),
  integration_id: z.string().uuid().nullable().optional(),
  available_at: z.string().optional(),
  lease_expires_at: z.string().nullable().optional(),
  heartbeat_at: z.string().nullable().optional(),
  checkpoint: z.record(z.unknown()).optional(),
  progress_current: z.number().nullable().optional(),
  progress_total: z.number().nullable().optional(),
  progress_message: z.string().nullable().optional(),
  last_attempt_started_at: z.string().nullable().optional(),
  updated_at: z.string().optional(),
  created_at: z.string(),
  started_at: z.string().nullable(),
  finished_at: z.string().nullable(),
});
export type SyncJob = z.infer<typeof SyncJobSchema>;

export const InviteUserSchema = z.object({
  full_name: z.string().min(1).max(120),
  email: z.string().email(),
  role_id: z.string().uuid(),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;

export const PORTFOLIO_METRIC_KEYS = {
  google_ads: ["spend", "conversions", "clicks", "impressions", "revenue"] as const,
  meta_ads: ["spend", "conversions", "clicks", "impressions", "revenue"] as const,
  tiktok_ads: ["spend", "conversions", "clicks", "impressions", "revenue"] as const,
  analytics: [
    "sessions",
    "active_users",
    "key_events",
    "total_revenue",
    "purchases",
    "conversion_rate",
    "sessions_not_set",
    "key_events_not_set",
    "revenue_not_set",
    "transactions",
    "transactions_not_set",
    "item_list_views",
    "item_views",
    "add_to_carts",
  ] as const,
  search_console: ["clicks", "impressions", "ctr", "position"] as const,
  tag_manager: [
    "tags_count",
    "triggers_count",
    "variables_count",
    "published_version_id",
  ] as const,
  merchant_center: [
    "total_products",
    "active_products",
    "disapproved_products",
    "pending_products",
    "account_issues_count",
  ] as const,
  youtube_analytics: [
    "views",
    "watch_time_minutes",
    "subscribers_gained",
    "likes",
    "comments",
    "subscriber_count",
  ] as const,
  page_speed: [
    "performance_score",
    "accessibility_score",
    "lcp_ms",
    "cls",
    "inp_ms",
  ] as const,
  google_indexing: [
    "urls_with_update",
    "urls_with_removal",
    "has_latest_update",
  ] as const,
  crux_history: [
    "lcp_p75",
    "cls_p75",
    "inp_p75",
    "fcp_p75",
    "ttfb_p75",
  ] as const,
  tiktok_organic: [
    "views",
    "likes",
    "comments",
    "shares",
    "profile_views",
    "follower_count",
  ] as const,
};

export function computeDeltaPercent(
  current: number,
  previous: number | null | undefined,
): number | null {
  if (previous == null || previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

export function computeCpa(spend: number, conversions: number): number | null {
  if (conversions === 0) return null;
  return spend / conversions;
}

export function computeRoas(revenue: number, spend: number): number | null {
  if (spend === 0) return null;
  return revenue / spend;
}

export function slugifyClientName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

export function resolveUserPermissions(
  role: UserRole,
  permissions: UserPermissions = {},
  assignedRoles: Pick<AppRole, "permissions">[] = [],
): Record<PermissionKey, boolean> {
  if (assignedRoles.length > 0) {
    return mergeRolePermissions(assignedRoles);
  }

  const defaults = DEFAULT_ROLE_PERMISSIONS[role];

  if (role === "admin") {
    return { ...defaults };
  }

  return PERMISSION_DEFINITIONS.reduce(
    (resolved, definition) => {
      resolved[definition.key] =
        permissions[definition.key] ?? defaults[definition.key];
      return resolved;
    },
    { ...EMPTY_PERMISSIONS },
  );
}

export function hasPermission(
  role: UserRole,
  permissions: UserPermissions,
  key: PermissionKey,
  options?: {
    isSystemAdmin?: boolean;
    assignedRoles?: Pick<AppRole, "permissions">[];
  },
): boolean {
  if (options?.isSystemAdmin) {
    return true;
  }

  if (options?.assignedRoles && options.assignedRoles.length > 0) {
    return mergeRolePermissions(options.assignedRoles)[key];
  }

  if (role === "admin") {
    return true;
  }

  return resolveUserPermissions(role, permissions)[key];
}

export type {
  UxAnalyticsSnapshot,
  UxAnalyticsSnapshotPayload,
  UxGa4BrowserRow,
  UxGa4ChannelRow,
  UxGa4CityRow,
  UxGa4CustomEventRow,
  UxGa4DeviceRow,
  UxGa4FunnelByChannelRow,
  UxGa4FunnelByDeviceRow,
  UxGa4FunnelStep,
  UxGa4ProductRow,
} from "./ux-analytics.js";

export {
  UxAnalyticsSnapshotPayloadSchema,
  UxGa4CityRowSchema,
  UxGa4DeviceRowSchema,
  UxGa4FunnelStepSchema,
  UxGa4ProductRowSchema,
} from "./ux-analytics.js";

export {
  AppLocaleSchema,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "./locale.js";

export {
  DEFAULT_CURRENCY,
  DISPLAY_CURRENCIES,
  formatCurrency,
  pickDominantCurrency,
  resolveDisplayCurrency,
  type DisplayCurrency,
} from "./currency.js";

export {
  DEFAULT_LIST_LIMIT,
  MAX_LIST_LIMIT,
  ListQuerySchema,
  clampListLimit,
  type ListQuery,
} from "./pagination.js";

export {
  ECOMMERCE_FUNNEL_EVENTS,
  LEAD_GEN_EVENTS,
  TrackerAnomalyReadinessSchema,
  TrackerBusinessModelSchema,
  TrackerCheckStatusSchema,
  TrackerIssueSeveritySchema,
  TrackerIssueStatusSchema,
  type AgencyTrackerBundle,
  type TrackerAnomalyReadiness,
  type TrackerBaselineDelta,
  type TrackerBusinessModel,
  type TrackerCheck,
  type TrackerCheckStatus,
  type TrackerEvidenceItem,
  type TrackerIssue,
  type TrackerIssueSeverity,
  type TrackerIssueStatus,
  type TrackerOverview,
  type TrackerSchemaItem,
} from "./agency-tracker.js";

export {
  buildAgencyTrackerBundle,
  buildSchemaItems,
  buildTrackerEvidence,
  buildTrackerIssues,
  buildTrackingChecks,
  computeAnomalyReadiness,
  computeConfidenceScore,
  inferBusinessModel,
  type AgencyTrackerCustomEvent,
  type AgencyTrackerFunnelStep,
  type AgencyTrackerInput,
  type AgencyTrackerSyncLog,
} from "./agency-tracker-build.js";

export {
  isApiErrorResponse,
  type ApiErrorResponse,
  type ApiMessageResponse,
  type ApiOkResponse,
} from "./api-response.js";

export {
  DEFAULT_STAGE_TASKS,
  LEAD_PIPELINE_STAGES,
  LEAD_STATUSES,
  LeadAssigneeSchema,
  LeadDetailSchema,
  LeadLegalSchema,
  LeadMeetingSchema,
  AdminLeadNoteSchema,
  LeadNoteAuthorSchema,
  LeadNoteSchema,
  LeadOfferSchema,
  LeadPrioritySchema,
  LeadSchema,
  LeadServiceSchema,
  LeadStatusSchema,
  LeadTaskSchema,
  LeadWebhookPayloadSchema,
  LeadWithAssigneeSchema,
  CreateLeadSchema,
  UpdateLeadSchema,
  buildDefaultTasksForStage,
  getNextStage,
  getStageBadgeClass,
  getStageIndex,
  getStageLabel,
  getTimelineStepState,
  summarizeLeads,
  summarizePipeline,
  LeadCommunicationSchema,
  GmailConnectionStatusSchema,
  type CreateLeadInput,
  type LeadCommunication,
  type GmailConnectionStatus,
  type Lead,
  type LeadAssignee,
  type LeadDetail,
  type LeadLegal,
  type LeadMeeting,
  type AdminLeadNote,
  type LeadNote,
  type LeadNoteAuthor,
  type LeadOffer,
  type LeadPipelineStage,
  type LeadPriority,
  type LeadService,
  type LeadStatus,
  type LeadSummary,
  type LeadTask,
  type LeadWebhookPayload,
  type LeadWithAssignee,
  type PipelineKpis,
  type TimelineStepState,
  type UpdateLeadInput,
} from "./leads.js";
