import type {
  AutoAcceptSettings,
  BoardConfigs,
  BoardMeta,
  ConfigMeta,
  ConfigTypeId,
  ConfigTypeMeta,
  CustomerOption,
  CustomerSettings,
  DayKey,
  LegTypeConfig,
  NotificationSettings,
  RegionOption,
  RegionSettings,
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
]

export const BOARDS: BoardMeta[] = [
  { id: 'ab-cdn-east', name: 'AB CDN East Coast Inbound', shortName: 'AB CDN East In', legCount: 63 },
  { id: 'ab-cdn-west', name: 'AB CDN West Coast Inbound', shortName: 'AB CDN West In', legCount: 41 },
  { id: 'ab-fleet-in', name: 'AB Fleet Inbound', shortName: 'AB Fleet In', legCount: 28 },
  { id: 'ab-fleet-out', name: 'AB Fleet Outbound', shortName: 'AB Fleet Out', legCount: 34 },
  { id: 'alex-kawalit', name: 'Alex Kawalit Board', shortName: 'Alex Kawalit', legCount: 19 },
]

export const CONFIG_TYPES: ConfigTypeMeta[] = [
  {
    id: 'auto-accept',
    label: 'Auto Accept',
    description: 'Lead time, time windows, days, and per-leg toggles.',
  },
  {
    id: 'customers',
    label: 'Customers',
    description: 'Include or exclude customers for this board.',
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
    description: 'Auto-accept rules for pickup legs on this board.',
    accent: 'pickup',
  },
  delivery: {
    label: 'Delivery',
    short: 'D',
    description: 'Auto-accept rules for delivery legs on this board.',
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
        reason: 'Initial board configuration',
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

function defaultAutoAccept(): AutoAcceptSettings {
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
  }
}

function defaultCustomers(): CustomerSettings {
  return {
    customerMode: 'exclude',
    customers: ['c-customer-c'],
  }
}

function defaultRegions(): RegionSettings {
  return {
    defaultStart: ['r-detroit', 'r-midwest'],
    defaultFinish: ['r-texas', 'r-ontario'],
    allowedRegions: ['r-midwest', 'r-detroit', 'r-texas', 'r-east', 'r-ontario'],
  }
}

function defaultNotifications(): NotificationSettings {
  return {
    emailOnSave: true,
    emailOnAutoAccept: false,
    slackChannel: '#planning-board-ops',
    notifyRoles: ['Ops Admin', 'Dispatch Lead'],
  }
}

export function createBoardConfigs(boardId: string): BoardConfigs {
  const owner =
    boardId === 'alex-kawalit'
      ? USERS[1]
      : boardId.startsWith('ab-fleet')
        ? USERS[2]
        : USERS[3]

  return {
    'auto-accept': {
      type: 'auto-accept',
      data: defaultAutoAccept(),
      meta: makeMeta(owner, USERS[2], 'Aligned lead times with East Coast SLA', 21, 3),
    },
    customers: {
      type: 'customers',
      data: defaultCustomers(),
      meta: makeMeta(owner, owner, 'Exclude Customer C from auto tendering', 18, 8),
    },
    regions: {
      type: 'regions',
      data: defaultRegions(),
      meta: makeMeta(USERS[2], CURRENT_USER, 'Added Midwest as intermediate coverage', 14, 1),
    },
    notifications: {
      type: 'notifications',
      data: defaultNotifications(),
      meta: makeMeta(USERS[1], USERS[1], 'Enable Slack alerts for rule changes', 10, 10),
    },
  }
}

export function configTypeLabel(id: ConfigTypeId): string {
  return CONFIG_TYPES.find((c) => c.id === id)?.label ?? id
}
