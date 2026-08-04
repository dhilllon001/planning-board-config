import type {
  BoardConfig,
  BoardMeta,
  CustomerOption,
  DayKey,
  LegTypeConfig,
  RegionOption,
} from '../types'

export const BOARDS: BoardMeta[] = [
  { id: 'ab-cdn-east', name: 'AB CDN East Coast Inbound', shortName: 'AB CDN East Coast In…' },
  { id: 'ab-cdn-west', name: 'AB CDN West Coast Inbound', shortName: 'AB CDN West Coast In…' },
  { id: 'ab-fleet-in', name: 'AB Fleet Inbound', shortName: 'AB Fleet Inbound' },
  { id: 'ab-fleet-out', name: 'AB Fleet Outbound', shortName: 'AB Fleet Outbound' },
  { id: 'alex-kawalit', name: 'Alex Kawalit Board', shortName: 'Alex Kawalit Board' },
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

export function createDefaultConfig(boardId: string): BoardConfig {
  return {
    boardId,
    autoAccept: true,
    customerMode: 'exclude',
    customers: ['c-customer-c'],
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
