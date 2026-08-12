export type StopKind = 'PICKUP' | 'DELIVERY' | 'HOOK' | 'DROP'

export interface RouteStop {
  kind: StopKind
  name: string
  city: string
  when: string
}

export interface BoardLeg {
  id: string
  boardId: string
  customer: string
  customerId: string
  tag: string
  timeLabel: string
  timeTone: 'ok' | 'warn' | 'expired'
  miles: number
  start: RouteStop
  end: RouteStop
  equipment: string
  driver: string | null
  assigned: string
  tenderBy: string
  tenderAt: string
  ack: 'pending' | 'accepted' | 'rejected'
  routeStatus?: string
}

export interface BoardCustomerCount {
  id: string
  name: string
  count: number
}

export interface FilterChip {
  id: string
  label: string
  count: number
  tone?: 'danger' | 'warn' | 'muted' | 'info'
}

export const BOARD_TABS = [
  { id: 'ab-cdn-east', name: 'AB CDN East Coast Inbound', short: 'AB CDN East Coast In…' },
  { id: 'ab-cdn-west', name: 'AB CDN West Coast Inbound', short: 'AB CDN West Coast In…' },
  { id: 'ab-fleet-in', name: 'AB Fleet Inbound', short: 'AB Fleet Inbound' },
  { id: 'ab-fleet-out', name: 'AB Fleet Outbound', short: 'AB Fleet Outbound' },
  { id: 'alex-kawalit', name: 'Alex Kawalit Board', short: 'Alex Kawalit Board' },
  { id: 'midwest-auto', name: 'Midwest Automotive Inbound', short: 'Midwest Auto In…' },
  { id: 'texas-border', name: 'Texas Border Crossdock', short: 'TX Border' },
  { id: 'ontario-relay', name: 'Ontario Relay Network', short: 'Ontario Relay' },
] as const

export const STATUS_FILTERS: FilterChip[] = [
  { id: 'rejected', label: 'Rejected', count: 22, tone: 'danger' },
  { id: 'fallback', label: 'Fallback', count: 18, tone: 'warn' },
  { id: 'expired', label: 'Expired', count: 2, tone: 'danger' },
]

export const TYPE_FILTERS: FilterChip[] = [
  { id: 'pd', label: 'PD', count: 31, tone: 'info' },
  { id: 'p', label: 'P', count: 4, tone: 'info' },
  { id: 'd', label: 'D', count: 24, tone: 'info' },
  { id: 'm', label: 'M', count: 3, tone: 'muted' },
]

export const TIME_FILTERS: FilterChip[] = [
  { id: 'past', label: 'Past', count: 6 },
  { id: 'today', label: 'Today', count: 9 },
  { id: 'tomorrow', label: 'Tomorrow', count: 7 },
  { id: 'next3', label: 'Next 3', count: 11 },
  { id: 'next7', label: 'Next 7', count: 14 },
  { id: 'next15', label: 'Next 15', count: 8 },
  { id: 'nodate', label: 'No Date', count: 2 },
]

export const BOARD_CUSTOMERS: BoardCustomerCount[] = [
  { id: 'ryder', name: 'RYDER INTEGRATED LOGISTICS', count: 19 },
  { id: 'penske', name: 'PENSKE (FORD) CL US', count: 17 },
  { id: 'vw', name: 'VOLKSWAGEN GROUP', count: 8 },
  { id: 'tjx', name: 'TJX CANADA', count: 6 },
  { id: 'ford', name: 'FORD MOTOR COMPANY', count: 5 },
  { id: 'gm', name: 'GENERAL MOTORS', count: 4 },
  { id: 'stellantis', name: 'STELLANTIS NA', count: 4 },
  { id: 'toyota', name: 'TOYOTA LOGISTICS', count: 3 },
  { id: 'honda', name: 'HONDA OF AMERICA', count: 3 },
  { id: 'bmw', name: 'BMW NA LOGISTICS', count: 2 },
]

function leg(
  partial: Omit<BoardLeg, 'boardId'> & { boardId?: string },
): BoardLeg {
  return {
    boardId: 'ab-cdn-east',
    ...partial,
  }
}

export const BOARD_LEGS: BoardLeg[] = [
  leg({
    id: 'leg-11249432',
    customer: 'PENSKE (FORD) CL US',
    customerId: '11249432',
    tag: 'GLAM',
    timeLabel: '4d 12:31:32',
    timeTone: 'ok',
    miles: 777.4,
    start: {
      kind: 'PICKUP',
      name: 'RAVISA - LAREDO',
      city: 'Laredo, TX',
      when: 'Aug 19 09:00',
    },
    end: {
      kind: 'DELIVERY',
      name: 'PLANTA VOLKSWAGEN',
      city: 'Sanctorum, PB',
      when: 'Aug 24 00:00',
    },
    equipment: 'DRY-VAN',
    driver: null,
    assigned: 'FALLBACK',
    tenderBy: 'SYSTEM',
    tenderAt: 'Aug 12 08:14',
    ack: 'pending',
    routeStatus: 'PENDING',
  }),
  leg({
    id: 'leg-11249488',
    customer: 'TJX CANADA',
    customerId: '11249488',
    tag: 'Default',
    timeLabel: 'EXPIRED',
    timeTone: 'expired',
    miles: 560.5,
    start: {
      kind: 'HOOK',
      name: 'TS TRANSPORTES NLD',
      city: 'Nuevo Laredo, TM',
      when: 'Aug 18 14:30',
    },
    end: {
      kind: 'DROP',
      name: 'HITACHI AUTOMOTIVE',
      city: 'QUERETARO, QA',
      when: 'Aug 22 06:00',
    },
    equipment: 'REEFER',
    driver: 'JORGEI',
    assigned: 'DEFAULT',
    tenderBy: 'SYSTEM',
    tenderAt: 'Aug 11 19:02',
    ack: 'accepted',
  }),
  leg({
    id: 'leg-11249501',
    customer: 'RYDER INTEGRATED LOGISTICS',
    customerId: '11249501',
    tag: 'LAM',
    timeLabel: '11:05:59',
    timeTone: 'warn',
    miles: 472.0,
    start: {
      kind: 'PICKUP',
      name: 'MICHIGAN ASSEMBLY',
      city: 'Wayne, MI',
      when: 'Aug 12 16:00',
    },
    end: {
      kind: 'DELIVERY',
      name: 'LAREDO CROSSDOCK',
      city: 'Laredo, TX',
      when: 'Aug 14 08:00',
    },
    equipment: 'DRY-VAN',
    driver: null,
    assigned: 'FALLBACK',
    tenderBy: 'SYSTEM',
    tenderAt: 'Aug 12 07:40',
    ack: 'pending',
    routeStatus: 'PENDING DROP',
  }),
  leg({
    id: 'leg-11249522',
    customer: 'VOLKSWAGEN GROUP',
    customerId: '11249522',
    tag: 'GLAM',
    timeLabel: '2d 03:18:44',
    timeTone: 'ok',
    miles: 318.2,
    start: {
      kind: 'PICKUP',
      name: 'DETROIT HUB',
      city: 'Detroit, MI',
      when: 'Aug 13 10:00',
    },
    end: {
      kind: 'DELIVERY',
      name: 'ONTARIO RELAY',
      city: 'Windsor, ON',
      when: 'Aug 14 18:00',
    },
    equipment: 'DRY-VAN',
    driver: 'MARTINEZ',
    assigned: 'DEFAULT',
    tenderBy: 'SYSTEM',
    tenderAt: 'Aug 12 06:55',
    ack: 'accepted',
  }),
  leg({
    id: 'leg-11249540',
    customer: 'FORD MOTOR COMPANY',
    customerId: '11249540',
    tag: 'Default',
    timeLabel: '7d 11:05:59',
    timeTone: 'ok',
    miles: 891.6,
    start: {
      kind: 'HOOK',
      name: 'KANSAS CITY YARD',
      city: 'Kansas City, MO',
      when: 'Aug 15 07:00',
    },
    end: {
      kind: 'DROP',
      name: 'MONTERREY HUB',
      city: 'Monterrey, NL',
      when: 'Aug 19 22:00',
    },
    equipment: 'REEFER',
    driver: null,
    assigned: 'FALLBACK',
    tenderBy: 'SYSTEM',
    tenderAt: 'Aug 12 09:11',
    ack: 'rejected',
  }),
  leg({
    id: 'leg-11249561',
    customer: 'GENERAL MOTORS',
    customerId: '11249561',
    tag: 'LAM',
    timeLabel: '1d 08:44:12',
    timeTone: 'ok',
    miles: 214.8,
    start: {
      kind: 'PICKUP',
      name: 'FLINT ASSEMBLY',
      city: 'Flint, MI',
      when: 'Aug 13 05:30',
    },
    end: {
      kind: 'DELIVERY',
      name: 'BUFFALO DC',
      city: 'Buffalo, NY',
      when: 'Aug 13 20:00',
    },
    equipment: 'DRY-VAN',
    driver: 'ALVAREZ',
    assigned: 'DEFAULT',
    tenderBy: 'SYSTEM',
    tenderAt: 'Aug 12 05:20',
    ack: 'pending',
  }),
  leg({
    id: 'leg-11249580',
    customer: 'STELLANTIS NA',
    customerId: '11249580',
    tag: 'GLAM',
    timeLabel: 'EXPIRED',
    timeTone: 'expired',
    miles: 640.1,
    start: {
      kind: 'PICKUP',
      name: 'TOLEDO SUPPLIER PARK',
      city: 'Toledo, OH',
      when: 'Aug 10 12:00',
    },
    end: {
      kind: 'DELIVERY',
      name: 'LAREDO STAGING',
      city: 'Laredo, TX',
      when: 'Aug 12 06:00',
    },
    equipment: 'DRY-VAN',
    driver: null,
    assigned: 'FALLBACK',
    tenderBy: 'SYSTEM',
    tenderAt: 'Aug 09 21:33',
    ack: 'rejected',
    routeStatus: 'EXPIRED',
  }),
  leg({
    id: 'leg-11249602',
    customer: 'BMW NA LOGISTICS',
    customerId: '11249602',
    tag: 'Default',
    timeLabel: '5d 02:10:08',
    timeTone: 'ok',
    miles: 505.3,
    start: {
      kind: 'PICKUP',
      name: 'SPARTANBURG PLANT',
      city: 'Spartanburg, SC',
      when: 'Aug 14 09:00',
    },
    end: {
      kind: 'DELIVERY',
      name: 'PORT OF SAVANNAH',
      city: 'Savannah, GA',
      when: 'Aug 15 16:30',
    },
    equipment: 'REEFER',
    driver: null,
    assigned: 'DEFAULT',
    tenderBy: 'SYSTEM',
    tenderAt: 'Aug 12 10:02',
    ack: 'pending',
  }),
]
