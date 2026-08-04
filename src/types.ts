export type LegType = 'pickup' | 'delivery' | 'movement'

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type CustomerMode = 'include' | 'exclude'

export interface TimeWindow {
  start: string
  end: string
}

export interface RegionRule {
  start: string[]
  finish: string[]
  intermediate: string[]
}

export interface LegTypeConfig {
  enabled: boolean
  leadTimeHours: number
  timeOfDay: TimeWindow
  daysAllowed: DayKey[]
  regions: RegionRule
}

export interface BoardConfig {
  boardId: string
  autoAccept: boolean
  legs: Record<LegType, LegTypeConfig>
  customerMode: CustomerMode
  customers: string[]
}

export interface BoardMeta {
  id: string
  name: string
  shortName: string
}

export interface CustomerOption {
  id: string
  name: string
  tag: string
}

export interface RegionOption {
  id: string
  name: string
  group: string
}
