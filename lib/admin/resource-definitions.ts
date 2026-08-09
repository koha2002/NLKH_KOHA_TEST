export type ResourceDefinition = {
  table: string;
  permission: string;
  fields: readonly string[];
  orderBy?: string;
  ascending?: boolean;
};

export const resourceDefinitions: Record<string, ResourceDefinition> = {
  "site-settings": {
    table: "site_settings",
    permission: "site.manage",
    fields: ["site_name","site_url","default_title_vi","default_title_en","title_template","description_vi","description_en","default_og_image","contact_email","footer_intro_vi","footer_intro_en","copyright_text","news_enabled","registration_enabled","maintenance_mode","extra"],
  },
  menu: {
    table: "navigation_items",
    permission: "site.manage",
    fields: ["label_vi","label_en","href","location","parent_id","sort_order","visible","requires_auth","allowed_roles","open_new_tab"],
    orderBy: "sort_order",
  },
  socials: {
    table: "social_links",
    permission: "site.manage",
    fields: ["platform","label","url","icon","sort_order","visible"],
    orderBy: "sort_order",
  },
  pages: {
    table: "content_pages",
    permission: "content.manage",
    fields: ["slug","title_vi","title_en","excerpt_vi","excerpt_en","content_vi","content_en","template","status","requires_auth","allowed_roles","published_at"],
    orderBy: "updated_at",
    ascending: false,
  },
  blocks: {
    table: "content_blocks",
    permission: "content.manage",
    fields: ["page_key","block_key","label","content","sort_order","visible"],
    orderBy: "sort_order",
  },
  seo: {
    table: "seo_entries",
    permission: "seo.manage",
    fields: ["route","title_vi","title_en","description_vi","description_en","canonical_path","og_image","og_type","indexable","follow_links","schema_type","structured_data","change_frequency","priority"],
    orderBy: "route",
  },
  redirects: {
    table: "redirects",
    permission: "seo.manage",
    fields: ["source_path","target_url","status_code","active","preserve_query","note"],
    orderBy: "updated_at",
    ascending: false,
  },
  tools: {
    table: "tools",
    permission: "tools.manage",
    fields: ["slug","code","route","title_vi","title_en","description_vi","description_en","icon","accent","status","visible","show_home","show_orbit","orbit_ring","orbit_angle","sort_order","requires_auth","allowed_roles","settings"],
    orderBy: "sort_order",
  },
  orbit: {
    table: "orbit_rings",
    permission: "tools.manage",
    fields: ["id","size","duration","reverse","dashed","dot_angle","dot_tone","sort_order","visible"],
    orderBy: "sort_order",
  },
  "news-categories": {
    table: "news_categories",
    permission: "news.manage",
    fields: ["slug","name_vi","name_en","description_vi","description_en","color","sort_order","visible"],
    orderBy: "sort_order",
  },
  news: {
    table: "news_articles",
    permission: "news.manage",
    fields: ["slug","category_id","title_vi","title_en","subtitle_vi","subtitle_en","excerpt_vi","excerpt_en","content_vi","content_en","cover_image","cover_alt_vi","cover_alt_en","author_name","translator_name","editor_name","source_name","source_url","tags","status","featured","allow_comments","published_at"],
    orderBy: "updated_at",
    ascending: false,
  },
  "software-categories": {
    table: "software_categories",
    permission: "software.manage",
    fields: ["slug","name_vi","name_en","sort_order","visible"],
    orderBy: "sort_order",
  },
  software: {
    table: "software_items",
    permission: "software.manage",
    fields: ["name","slug","category_id","description_vi","description_en","icon_url","cover_url","download_url","price_label_vi","price_label_en","version","compatibility","visible","featured","sort_order"],
    orderBy: "sort_order",
  },
  "data-collections": {
    table: "data_collections",
    permission: "data.manage",
    fields: ["slug","name_vi","name_en","description_vi","description_en","icon","visibility","sort_order","visible"],
    orderBy: "sort_order",
  },
  "data-items": {
    table: "data_items",
    permission: "data.manage",
    fields: ["collection_id","title_vi","title_en","description_vi","description_en","item_type","external_url","object_key","media_id","visibility","sort_order","visible","metadata"],
    orderBy: "sort_order",
  },
  "data-access": {
    table: "user_data_access",
    permission: "data.manage",
    fields: ["user_id","item_id","expires_at"],
    orderBy: "created_at",
    ascending: false,
  },
  "cv-profiles": {
    table: "cv_profiles",
    permission: "content.manage",
    fields: ["name","role_vi","role_en","headline_vi","headline_en","summary_vi","summary_en","birth_date","address_vi","address_en","phone","email","photo_url","pdf_url","theme","published"],
  },
  "cv-sections": {
    table: "cv_sections",
    permission: "content.manage",
    fields: ["profile_id","section_type","title_vi","title_en","subtitle_vi","subtitle_en","period","description_vi","description_en","organization","url","sort_order","visible","data"],
    orderBy: "sort_order",
  },
  media: {
    table: "media_assets",
    permission: "media.manage",
    fields: ["object_key","public_url","original_name","mime_type","size_bytes","title","alt_vi","alt_en","folder","visibility","owner_id"],
    orderBy: "created_at",
    ascending: false,
  },
  profiles: {
    table: "profiles",
    permission: "users.manage",
    fields: ["display_name","avatar_url","role_id","status"],
    orderBy: "created_at",
    ascending: false,
  },
  roles: {
    table: "roles",
    permission: "users.manage",
    fields: ["id","name","permissions","description"],
    orderBy: "name",
  },
  integrations: {
    table: "api_integrations",
    permission: "api.manage",
    fields: ["slug","name","description","base_url","allowed_host","endpoint_template","method","headers_template","query_template","body_template","key_placeholder","scope","timeout_ms","active"],
    orderBy: "name",
  },
  jobs: {
    table: "scheduled_api_jobs",
    permission: "api.manage",
    fields: ["integration_id","name","handler","endpoint_path","request_payload","interval_minutes","enabled","next_run_at"],
    orderBy: "next_run_at",
  },
};

export function getResourceDefinition(resource: string) {
  return resourceDefinitions[resource] ?? null;
}
