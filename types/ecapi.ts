/**
 * IAB Tech Lab ECAPI (Event and Conversion API) v1.0 — TypeScript types
 *
 * Source spec: https://github.com/InteractiveAdvertisingBureau/ecapi
 * License of source spec: CC-BY 3.0
 *
 * ────────────────────────────────────────────────────────────────────────
 *  Source pin
 * ────────────────────────────────────────────────────────────────────────
 *  These types were generated from the ECAPI 1.0 specification at:
 *
 *    File:           ecapi_1.0.md
 *    Last modified:  2026-03-27 (commit 604fc2fae4140346abf63f7af53a225a60918cbd)
 *    Repo HEAD seen: 2026-04-28 (commit d1ee99d878cf8fb6a78da1bc8e74af960d3b0ee7)
 *    Generated on:   2026-05-01
 *
 *  To check for drift, compare against:
 *    https://github.com/InteractiveAdvertisingBureau/ecapi/blob/main/ecapi_1.0.md
 *  Or diff against the pinned revision:
 *    https://github.com/InteractiveAdvertisingBureau/ecapi/blob/604fc2fae4140346abf63f7af53a225a60918cbd/ecapi_1.0.md
 * ────────────────────────────────────────────────────────────────────────
 *
 * This file is a TypeScript representation of the ECAPI 1.0 payload schema.
 * It is published here under CC-BY 4.0 (for the spec text reference) and
 * Apache 2.0 (for use as code) via the LICENSE-CODE in this repository.
 *
 * Where this file disagrees with the upstream ECAPI specification, the
 * upstream specification is authoritative. File issues against this repo
 * if you find drift.
 */

// ---------------------------------------------------------------------------
// Event Type enumerations
// ---------------------------------------------------------------------------

/** ECAPI standard events — the most commonly shared events. */
export type EcapiStandardEvent =
  | 'purchase'
  | 'page_view'
  | 'ad_impression'
  | 'add_to_wishlist'
  | 'add_to_cart'
  | 'viewed_cart'
  | 'viewed_item'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'remove_from_cart'
  | 'refund'
  | 'generate_lead'
  | 'qualify_lead'
  | 'close_convert_lead'
  | 'disqualify_lead'
  | 'close_unconvert_lead'
  | 'sign_up'
  | 'search'
  | 'unlock_achievement'
  | 'install'
  | 'customize_product'
  | 'contact'
  | 'donate'
  | 'find_location'
  | 'schedule'
  | 'start_trial'
  | 'subscribe'
  | 'custom';

/** ECAPI additional events — lower-priority but still standardized. */
export type EcapiAdditionalEvent =
  | 'add_shipping_info'
  | 'share'
  | 'select_content'
  | 'select_item'
  | 'select_promotion'
  | 'view_item_list'
  | 'view_promotion'
  | 'view_search_results'
  | 'spend_virtual_currency'
  | 'earn_virtual_currency'
  | 'working_lead'
  | 'login'
  | 'join_group'
  | 'level_up'
  | 'post_score'
  | 'tutorial_begin'
  | 'tutorial_complete';

export type EcapiEventType = EcapiStandardEvent | EcapiAdditionalEvent;

/** Where the event took place. */
export type EcapiSource =
  | 'email'
  | 'website'
  | 'app'
  | 'phone_call'
  | 'chat'
  | 'physical_store'
  | 'system_generated'
  | 'business_messaging'
  | 'other';

/** Age range buckets. Integer-coded in the wire format. */
export type EcapiAgeRange = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/** Address type label. Integer-coded in the wire format. */
export type EcapiAddressType = 1 | 2 | 3; // 1=billing, 2=shipping, 3=unknown

// ---------------------------------------------------------------------------
// Sub-objects
// ---------------------------------------------------------------------------

/** A user identifier with provenance metadata. */
export interface EcapiUid {
  /** SHA-256 hashed user identifier. */
  id?: string;
  /** Canonical domain of the ID. */
  source?: string;
  /** Agent type per AdCOM 1.0 List: Agent Types. */
  atype?: number;
  /** Exchange-specific extensions. */
  ext?: Record<string, unknown>;
}

/** An address associated with an event. Most string fields are SHA-256 hashed. */
export interface EcapiAddress {
  /** SHA-256 hashed first name. */
  first_name?: string;
  /** SHA-256 hashed last name. */
  last_name?: string;
  /** SHA-256 hashed street address. */
  street?: string;
  /** Lowercase, no punctuation; UTF-8 if special chars. */
  city?: string;
  /** Lowercase, no punctuation; UTF-8 if special chars. */
  state?: string;
  /** ISO 3166-1 alpha-2, lowercase. */
  country_code?: string;
  /** SHA-256 hashed postal code. */
  postal_code?: string;
  /** 1=billing, 2=shipping, 3=unknown. */
  address_type?: EcapiAddressType;
  ext?: Record<string, unknown>;
}

/** Item metadata, used inside `properties.items`. */
export interface EcapiItem {
  /** UPC or SKU. */
  id?: string;
  name?: string;
  price?: number;
  discount?: number;
  quantity?: number;
  brand?: string;
  affiliation?: string;
  category?: string;
  /** Taxonomy used in `category`. See AdCOM 1.0 List: Category Taxonomies. */
  cattax?: number;
  item_coupon?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_item_variant?: string;
  item_location_id?: string;
  ext?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// user_data
// ---------------------------------------------------------------------------

/**
 * Metadata about the user associated with the event.
 *
 * IMPORTANT: most identifier fields here MUST be SHA-256 hashed. See ECAPI
 * 1.0 Normalization section. Implementers are responsible for compliance
 * with applicable data-protection law.
 */
export interface EcapiUserData {
  /** SHA-256 hashed advertiser-provided customer identifier. */
  customer_identifier?: string;
  uids?: EcapiUid[];
  /** General segment labels (e.g. "Gold Member"). */
  customer_segments?: string[];
  /** SHA-256 hashed email addresses. */
  email_address?: string | string[];
  /** SHA-256 hashed phone numbers in E.164-like form (with leading +). */
  phone_numbers?: string | string[];
  /** Local time offset from UTC in minutes. */
  utcoffset?: number;
  address?: EcapiAddress | EcapiAddress[];
  /** IAB Global Privacy Platform consent string. */
  gpp_string?: string;
  /** GPP section IDs that apply to this transaction. */
  gpp_sid?: number[];
  /**
   * If true, the event is for attribution only and must not be used for
   * ads delivery optimization. May be required in some jurisdictions.
   */
  mmt_only?: boolean;
  /** Click ID for the receiving partner/platform. */
  click_id?: string;
  /** Impression ID for the receiving partner/platform. */
  impression_id?: string;
  /** IPv4 or IPv6 address of the event. */
  event_ip_address?: string;
  event_user_agent?: string;
  /** Device identifier for advertising. */
  ifa?: string;
  landing_ip_address?: string;
  landing_user_agent?: string;
  age_range?: EcapiAgeRange;
  /** SHA-256 hashed gender. */
  gender?: string;
  ext?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// properties
// ---------------------------------------------------------------------------

/**
 * Additional metadata attached to an event. Different fields are relevant
 * to different event types; see ECAPI 1.0 for guidance on which fields
 * apply to which events.
 */
export interface EcapiProperties {
  transaction_id?: string;
  items?: EcapiItem[];
  page_url?: string;
  ad_source?: string;
  referrer?: string;
  coupon?: string | string[];
  shipping?: number;
  tax?: number;
  payment_type?: string | string[];
  shipping_tier?: string;
  virtual_currency_name?: string;
  virtual_item_name?: string;
  lead_source?: string;
  lead_status?: string;
  lead_reason?: string;
  ad_platform?: string;
  ad_format?: string;
  ad_unit_name?: string;
  login_method?: string;
  group_id?: string;
  character_level?: number;
  character?: string;
  post_score?: number;
  achievement_id?: string;
  search_term?: string;
  creative_name?: string;
  creative_slot?: string;
  promotion_id?: string;
  promotion_name?: string;
  availability?: number;
  body_style?: number;
  condition_of_vehicle?: number;
  arrival_date?: string;
  departure_date?: string;
  destination_airport?: string;
  destination_ids?: string;
  drivetrain?: number;
  exterior_color?: string;
  fuel_type?: number;
  lease_end_date?: string;
  lease_start_date?: string;
  listing_type?: number;
  make?: string;
  model?: string;
  transmission?: number;
  vin?: string;
  ext?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Core event object
// ---------------------------------------------------------------------------

/**
 * The ECAPI 1.0 event payload sent server-to-server from an advertiser
 * (or an advertiser's CAPI provider) to a receiving platform or partner.
 */
export interface EcapiEvent {
  /**
   * Identifier coordinated by both parties indicating the destination on
   * the receiving system. Required in ECAPI 1.0; OCP relaxes to optional.
   */
  data_set_id?: string;

  /**
   * Advertiser-chosen unique event ID. Used together with `data_set_id`
   * to dedupe events arriving from multiple sources (e.g. pixel + CAPI).
   */
  id?: string;

  /** Unix epoch seconds. */
  timestamp: number;

  /** Event type. If `custom`, populate `custom_event`. */
  event_type: EcapiEventType;

  /** Required when `event_type === 'custom'`. */
  custom_event?: string;

  user_data?: EcapiUserData;

  /** Total monetary value of the event. Requires `currency_code` if set. */
  value?: number;

  /** ISO 4217 currency code. Required when `value` is set. */
  currency_code?: string;

  /** Where the event happened. */
  source?: EcapiSource;

  properties?: EcapiProperties;

  /** Exchange-specific extensions. */
  ext?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Response codes
// ---------------------------------------------------------------------------

/** HTTP response codes used by ECAPI receivers. */
export type EcapiResponseCode = 200 | 400 | 401 | 404 | 429 | 500;
