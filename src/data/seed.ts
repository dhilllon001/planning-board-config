import type {
  AutoAcceptSettings,
  BoardMeta,
  ConfigMeta,
  ConfigSectionMeta,
  ConfigTemplate,
  CustomerOption,
  CustomerSettings,
  DayKey,
  LegTypeConfig,
  NotificationSettings,
  RegionOption,
  RegionSettings,
  TemplateSettings,
  UserRef,
} from '../types'

export const CURRENT_USER: UserRef = {
  id: 'u-sd',
  name: 'Sukhdeep Dhillon',
  email: 'sukhdeep@chargerlogistics.com',
  role: 'Ops Admin',
  initials: 'SD',
}

export const USERS: UserRef[] = [
  CURRENT_USER,
  {
    id: 'u-ak',
    name: 'Alex Kawalit',
    email: 'alex.kawalit@chargerlogistics.com',
    role: 'Board Owner',
    initials: 'AK',
  },
  {
    id: 'u-jm',
    name: 'Jessica Martin',
    email: 'jessica.martin@chargerlogistics.com',
    role: 'Dispatch Lead',
    initials: 'JM',
  },
  {
    id: 'u-rt',
    name: 'Ryan Torres',
    email: 'ryan.torres@chargerlogistics.com',
    role: 'Planner',
    initials: 'RT',
  },
  {
    id: 'u-np',
    name: 'Nina Patel',
    email: 'nina.patel@chargerlogistics.com',
    role: 'Planner',
    initials: 'NP',
  },
]

export const BOARDS: BoardMeta[] = [
  { id: 'ab-cdn-east', name: 'AB CDN East Coast Inbound', shortName: 'AB CDN East In', legCount: 63, region: 'East' },
  { id: 'ab-cdn-west', name: 'AB CDN West Coast Inbound', shortName: 'AB CDN West In', legCount: 41, region: 'West' },
  { id: 'ab-fleet-in', name: 'AB Fleet Inbound', shortName: 'AB Fleet In', legCount: 28, region: 'Fleet' },
  { id: 'ab-fleet-out', name: 'AB Fleet Outbound', shortName: 'AB Fleet Out', legCount: 34, region: 'Fleet' },
  { id: 'alex-kawalit', name: 'Alex Kawalit Board', shortName: 'Alex Kawalit', legCount: 19, region: 'Custom' },
  { id: 'midwest-auto', name: 'Midwest Automotive Inbound', shortName: 'Midwest Auto In', legCount: 52, region: 'Midwest' },
  { id: 'texas-border', name: 'Texas Border Crossdock', shortName: 'TX Border', legCount: 37, region: 'South' },
  { id: 'ontario-relay', name: 'Ontario Relay Network', shortName: 'Ontario Relay', legCount: 45, region: 'CDN' },
  { id: 'reefer-priority', name: 'Reefer Priority Board', shortName: 'Reefer Priority', legCount: 22, region: 'Special' },
  { id: 'power-only', name: 'Power Only Moves', shortName: 'Power Only', legCount: 31, region: 'Fleet' },
  { id: 'weekend-surge', name: 'Weekend Surge Board', shortName: 'Weekend Surge', legCount: 16, region: 'Special' },
  { id: 'glam-dedicated', name: 'GLAM Dedicated Lanes', shortName: 'GLAM Dedicated', legCount: 48, region: 'East' },
]

export const CONFIG_SECTIONS: ConfigSectionMeta[] = [
  {
    id: 'auto-accept',
    label: 'Auto Accept',
    description: 'Lead time, time windows, days, and per-leg toggles.',
  },
  {
    id: 'customers',
    label: 'Customers',
    description: 'Include or exclude customers for this template.',
  },
  {
    id: 'regions',
    label: 'Regions',
    description: 'Default start, finish, and allowed coverage regions.',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Email and Slack alerts when rules fire or change.',
  },
]

export const CUSTOMERS: CustomerOption[] = [
  { id: 'c-penske', name: 'PENSKE (FORD) CL US', tag: 'GLAM' },
  { id: 'c-ford', name: 'FORD MOTOR COMPANY', tag: 'Default' },
  { id: 'c-gm', name: 'GENERAL MOTORS', tag: 'LAM' },
  { id: 'c-stellantis', name: 'STELLANTIS NA', tag: 'GLAM' },
  { id: 'c-toyota', name: 'TOYOTA LOGISTICS', tag: 'Default' },
  { id: 'c-honda', name: 'HONDA OF AMERICA', tag: 'LAM' },
  { id: 'c-nissan', name: 'NISSAN NORTH AMERICA', tag: 'Default' },
  { id: 'c-customer-c', name: 'Customer C', tag: 'Default' },
  { id: 'c-bmw', name: 'BMW NA LOGISTICS', tag: 'GLAM' },
  { id: 'c-vw', name: 'VW GROUP TRANSPORT', tag: 'LAM' },
]

export const REGIONS: RegionOption[] = [
  { id: 'r-midwest', name: 'Midwest Hub', group: 'US' },
  { id: 'r-detroit', name: 'Detroit / Michigan', group: 'US' },
  { id: 'r-texas', name: 'South Texas / Laredo', group: 'US' },
  { id: 'r-east', name: 'East Coast Corridor', group: 'US' },
  { id: 'r-west', name: 'West Coast Corridor', group: 'US' },
  { id: 'r-ontario', name: 'Southern Ontario', group: 'CDN' },
  { id: 'r-quebec', name: 'Quebec Corridor', group: 'CDN' },
  { id: 'r-bc', name: 'BC Interior', group: 'CDN' },
  { id: 'r-monterrey', name: 'Monterrey Hub', group: 'MX' },
]

export const ALL_DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

export const LEG_META = {
  pickup: {
    label: 'Pickup',
    short: 'P',
    description: 'Auto-accept rules for pickup legs on this template.',
    accent: 'pickup',
  },
  delivery: {
    label: 'Delivery',
    short: 'D',
    description: 'Auto-accept rules for delivery legs on this template.',
    accent: 'delivery',
  },
  movement: {
    label: 'Movement',
    short: 'M',
    description: 'Auto-accept rules for empty / reposition movement legs.',
    accent: 'movement',
  },
} as const

const WEEKDAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri']
const ALL_WEEK: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function defaultLeg(partial?: Partial<LegTypeConfig>): LegTypeConfig {
  return {
    enabled: true,
    leadTimeHours: 12,
    timeOfDay: { start: '06:00', end: '18:00' },
    daysAllowed: [...WEEKDAYS],
    regions: { start: [], finish: [], intermediate: [] },
    ...partial,
  }
}

function isoDaysAgo(days: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 15, 0, 0)
  return d.toISOString()
}

function makeMeta(
  createdBy: UserRef,
  lastSavedBy: UserRef,
  reason: string,
  createdDaysAgo: number,
  savedDaysAgo: number,
): ConfigMeta {
  const createdAt = isoDaysAgo(createdDaysAgo, 9)
  const lastSavedAt = isoDaysAgo(savedDaysAgo, 14)
  return {
    createdBy,
    createdAt,
    lastSavedBy,
    lastSavedAt,
    reason,
    history: [
      {
        id: `h-${createdBy.id}-1`,
        savedBy: createdBy,
        savedAt: createdAt,
        reason: 'Initial template configuration',
      },
      ...(savedDaysAgo < createdDaysAgo
        ? [
            {
              id: `h-${lastSavedBy.id}-2`,
              savedBy: lastSavedBy,
              savedAt: lastSavedAt,
              reason,
            },
          ]
        : []),
    ],
  }
}

function defaultAutoAccept(overrides?: Partial<AutoAcceptSettings>): AutoAcceptSettings {
  return {
    autoAccept: true,
    legs: {
      pickup: defaultLeg({
        leadTimeHours: 12,
        timeOfDay: { start: '06:00', end: '18:00' },
        daysAllowed: [...WEEKDAYS],
        regions: {
          start: ['r-detroit', 'r-midwest'],
          finish: ['r-texas'],
          intermediate: [],
        },
      }),
      delivery: defaultLeg({
        leadTimeHours: 8,
        timeOfDay: { start: '07:00', end: '17:00' },
        daysAllowed: [...WEEKDAYS],
        regions: {
          start: ['r-texas'],
          finish: ['r-detroit', 'r-ontario'],
          intermediate: ['r-midwest'],
        },
      }),
      movement: defaultLeg({
        leadTimeHours: 4,
        timeOfDay: { start: '00:00', end: '23:59' },
        daysAllowed: [...ALL_WEEK],
        regions: {
          start: ['r-midwest'],
          finish: ['r-east', 'r-west'],
          intermediate: [],
        },
      }),
    },
    ...overrides,
  }
}

function defaultCustomers(overrides?: Partial<CustomerSettings>): CustomerSettings {
  return {
    customerMode: 'exclude',
    customers: ['c-customer-c'],
    ...overrides,
  }
}

function defaultRegions(overrides?: Partial<RegionSettings>): RegionSettings {
  return {
    defaultStart: ['r-detroit', 'r-midwest'],
    defaultFinish: ['r-texas', 'r-ontario'],
    allowedRegions: ['r-midwest', 'r-detroit', 'r-texas', 'r-east', 'r-ontario'],
    ...overrides,
  }
}

function defaultNotifications(overrides?: Partial<NotificationSettings>): NotificationSettings {
  return {
    emailOnSave: true,
    emailOnAutoAccept: false,
    slackChannel: '#planning-board-ops',
    notifyRoles: ['Ops Admin', 'Dispatch Lead'],
    ...overrides,
  }
}

function settingsBundle(partial?: {
  auto?: Partial<AutoAcceptSettings>
  customers?: Partial<CustomerSettings>
  regions?: Partial<RegionSettings>
  notifications?: Partial<NotificationSettings>
}): TemplateSettings {
  return {
    'auto-accept': defaultAutoAccept(partial?.auto),
    customers: defaultCustomers(partial?.customers),
    regions: defaultRegions(partial?.regions),
    notifications: defaultNotifications(partial?.notifications),
  }
}

function template(
  id: string,
  name: string,
  description: string,
  active: boolean,
  meta: ConfigMeta,
  settings?: Parameters<typeof settingsBundle>[0],
): ConfigTemplate {
  return {
    id,
    name,
    description,
    active,
    settings: settingsBundle(settings),
    meta,
  }
}

export function createTemplatesForBoard(boardId: string): ConfigTemplate[] {
  const owner =
    boardId === 'alex-kawalit'
      ? USERS[1]
      : boardId.includes('fleet') || boardId === 'power-only'
        ? USERS[2]
        : boardId.includes('weekend') || boardId.includes('reefer')
          ? USERS[4]
          : USERS[3]

  return [
    template(
      `${boardId}-default`,
      'Default Rules',
      'Standard weekday auto-accept for this board.',
      true,
      makeMeta(owner, USERS[2], 'Aligned lead times with board SLA', 21, 3),
    ),
    template(
      `${boardId}-weekend`,
      'Weekend Override',
      'Expanded movement window and longer lead times for Sat/Sun.',
      false,
      makeMeta(USERS[2], CURRENT_USER, 'Opened weekend movement coverage', 12, 2),
      {
        auto: {
          autoAccept: true,
          legs: {
            pickup: defaultLeg({
              enabled: true,
              leadTimeHours: 18,
              timeOfDay: { start: '08:00', end: '16:00' },
              daysAllowed: ['sat', 'sun'],
              regions: { start: ['r-midwest'], finish: ['r-east'], intermediate: [] },
            }),
            delivery: defaultLeg({
              enabled: true,
              leadTimeHours: 14,
              timeOfDay: { start: '08:00', end: '16:00' },
              daysAllowed: ['sat', 'sun'],
              regions: { start: ['r-east'], finish: ['r-midwest'], intermediate: [] },
            }),
            movement: defaultLeg({
              enabled: true,
              leadTimeHours: 6,
              timeOfDay: { start: '00:00', end: '23:59' },
              daysAllowed: [...ALL_WEEK],
              regions: { start: ['r-midwest'], finish: ['r-west'], intermediate: [] },
            }),
          },
        },
        notifications: {
          emailOnAutoAccept: true,
          slackChannel: '#weekend-ops',
          notifyRoles: ['Ops Admin', 'Planner'],
        },
      },
    ),
    template(
      `${boardId}-strict`,
      'Strict Customer Filter',
      'Include-only mode for priority customers on this board.',
      false,
      makeMeta(owner, owner, 'Limited auto-accept to GLAM accounts', 9, 5),
      {
        auto: { autoAccept: true },
        customers: {
          customerMode: 'include',
          customers: ['c-penske', 'c-stellantis', 'c-bmw'],
        },
        regions: {
          defaultStart: ['r-detroit'],
          defaultFinish: ['r-texas'],
          allowedRegions: ['r-detroit', 'r-texas', 'r-midwest'],
        },
      },
    ),
    template(
      `${boardId}-paused`,
      'Paused / Manual Only',
      'Master auto-accept off — planners ACK everything manually.',
      false,
      makeMeta(USERS[1], USERS[1], 'Paused auto-accept during volume spike', 4, 4),
      {
        auto: { autoAccept: false },
        notifications: {
          emailOnSave: true,
          emailOnAutoAccept: false,
          slackChannel: '#planning-board-ops',
          notifyRoles: ['Board Owner', 'Dispatch Lead'],
        },
      },
    ),
  ]
}

export function createEmptyTemplate(boardId: string): ConfigTemplate {
  const now = new Date().toISOString()
  return {
    id: `${boardId}-tmpl-${Date.now()}`,
    name: 'New Template',
    description: 'Custom configuration template for this board.',
    active: false,
    settings: settingsBundle(),
    meta: {
      createdBy: CURRENT_USER,
      createdAt: now,
      lastSavedBy: CURRENT_USER,
      lastSavedAt: now,
      reason: 'Created new configuration template',
      history: [
        {
          id: `h-${Date.now()}`,
          savedBy: CURRENT_USER,
          savedAt: now,
          reason: 'Created new configuration template',
        },
      ],
    },
  }
}

export function sectionLabel(id: ConfigSectionMeta['id']): string {
  return CONFIG_SECTIONS.find((c) => c.id === id)?.label ?? id
}
