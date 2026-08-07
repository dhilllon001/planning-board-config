export type LegType = 'pickup' | 'delivery' | 'movement'

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type CustomerMode = 'include' | 'exclude'

export type ConfigSectionId = 'auto-accept' | 'customers' | 'regions' | 'notifications'

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

export interface AutoAcceptSettings {
  autoAccept: boolean
  legs: Record<LegType, LegTypeConfig>
}

export interface CustomerSettings {
  customerMode: CustomerMode
  customers: string[]
}

export interface RegionSettings {
  defaultStart: string[]
  defaultFinish: string[]
  allowedRegions: string[]
}

export interface NotificationSettings {
  emailOnSave: boolean
  emailOnAutoAccept: boolean
  slackChannel: string
  notifyRoles: string[]
}

export interface TemplateSettings {
  'auto-accept': AutoAcceptSettings
  customers: CustomerSettings
  regions: RegionSettings
  notifications: NotificationSettings
}

export interface UserRef {
  id: string
  name: string
  email: string
  role: string
  initials: string
}

export interface ConfigHistoryEntry {
  id: string
  savedBy: UserRef
  savedAt: string
  reason: string
}

export interface ConfigMeta {
  createdBy: UserRef
  createdAt: string
  lastSavedBy: UserRef
  lastSavedAt: string
  reason: string
  history: ConfigHistoryEntry[]
}

export interface ConfigTemplate {
  id: string
  name: string
  description: string
  active: boolean
  settings: TemplateSettings
  meta: ConfigMeta
}

export interface BoardMeta {
  id: string
  name: string
  shortName: string
  legCount: number
  region: string
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

export interface ConfigSectionMeta {
  id: ConfigSectionId
  label: string
  description: string
}
