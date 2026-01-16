// =============================================================================
// SEMANTIC TYPE SYSTEM — Core type definitions (Blueprint §3.1)
// =============================================================================

// -----------------------------------------------------------------------------
// Dimension & Base Types
// -----------------------------------------------------------------------------

export type BaseType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

export type TypeCategory =
  | 'numeric'
  | 'text'
  | 'temporal'
  | 'boolean'
  | 'measurement'
  | 'financial'
  | 'identifier'
  | 'contact'
  | 'geographic'
  | 'custom';

export type Dimension =
  | 'length'
  | 'mass'
  | 'time'
  | 'temperature'
  | 'area'
  | 'volume'
  | 'speed'
  | 'data'
  | 'currency';

// -----------------------------------------------------------------------------
// Format & Validator Specs
// -----------------------------------------------------------------------------

export interface FormatSpec {
  type: string;
  decimals?: number;
  currency?: string;
  pattern?: string;
  unit?: string;
  locale?: string;
  trueLabel?: string;
  falseLabel?: string;
  language?: string;
  prefix?: string;
  suffix?: string;
  thousandsSeparator?: boolean;
}

export interface ValidatorSpec {
  type: string;
  message?: string;
  min?: number;
  max?: number;
  value?: unknown;
  pattern?: string;
  values?: unknown[];
}

// -----------------------------------------------------------------------------
// Semantic Type Interface
// -----------------------------------------------------------------------------

export interface SemanticType {
  id: string;
  name: string;
  category: TypeCategory;
  baseType: BaseType;
  nullable: boolean;
  defaultFormat: FormatSpec;
  inputFormat?: string;
  validators: ValidatorSpec[];
  dimension?: Dimension;
  defaultUnit?: string;
  icon?: string;
  color?: string;
  description?: string;
}

// -----------------------------------------------------------------------------
// Typed Value
// -----------------------------------------------------------------------------

export interface TypedValue {
  raw: unknown;
  type: string;
  unit?: string;
  formatted: string;
  valid: boolean;
  errors?: string[];
}

// -----------------------------------------------------------------------------
// Built-in Types (25+ types)
// -----------------------------------------------------------------------------

export const BUILT_IN_TYPES: Record<string, SemanticType> = {
  // ═══════════════════════════════════════════════════════════════
  // NUMERIC
  // ═══════════════════════════════════════════════════════════════
  number: {
    id: 'number',
    name: 'Number',
    category: 'numeric',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'number', decimals: 2 },
    validators: [{ type: 'isNumber' }],
    icon: '#',
    color: '#3b82f6',
    description: 'General numeric value',
  },
  integer: {
    id: 'integer',
    name: 'Integer',
    category: 'numeric',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'number', decimals: 0 },
    validators: [{ type: 'isNumber' }, { type: 'isInteger' }],
    icon: '123',
    color: '#3b82f6',
    description: 'Whole number without decimals',
  },
  percentage: {
    id: 'percentage',
    name: 'Percentage',
    category: 'numeric',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'percent', decimals: 1 },
    validators: [{ type: 'isNumber' }, { type: 'range', min: 0, max: 100 }],
    icon: '%',
    color: '#8b5cf6',
    description: 'Percentage value (0-100)',
  },

  // ═══════════════════════════════════════════════════════════════
  // FINANCIAL
  // ═══════════════════════════════════════════════════════════════
  currency: {
    id: 'currency',
    name: 'Currency',
    category: 'financial',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'currency', currency: 'USD', decimals: 2 },
    validators: [{ type: 'isNumber' }],
    icon: '$',
    color: '#22c55e',
    description: 'Monetary value in USD',
  },
  currency_vnd: {
    id: 'currency_vnd',
    name: 'VND',
    category: 'financial',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'currency', currency: 'VND', decimals: 0 },
    validators: [{ type: 'isNumber' }, { type: 'isInteger' }],
    icon: '₫',
    color: '#22c55e',
    description: 'Vietnamese Dong',
  },
  accounting: {
    id: 'accounting',
    name: 'Accounting',
    category: 'financial',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'accounting', currency: 'USD', decimals: 2 },
    validators: [{ type: 'isNumber' }],
    icon: '📊',
    color: '#22c55e',
    description: 'Accounting format with aligned currency symbols',
  },

  // ═══════════════════════════════════════════════════════════════
  // TEMPORAL
  // ═══════════════════════════════════════════════════════════════
  date: {
    id: 'date',
    name: 'Date',
    category: 'temporal',
    baseType: 'date',
    nullable: true,
    defaultFormat: { type: 'date', pattern: 'yyyy-MM-dd' },
    validators: [{ type: 'isDate' }],
    icon: '📅',
    color: '#f59e0b',
    description: 'Calendar date',
  },
  datetime: {
    id: 'datetime',
    name: 'Date & Time',
    category: 'temporal',
    baseType: 'date',
    nullable: true,
    defaultFormat: { type: 'datetime', pattern: 'yyyy-MM-dd HH:mm' },
    validators: [{ type: 'isDate' }],
    icon: '🕐',
    color: '#f59e0b',
    description: 'Date with time',
  },
  time: {
    id: 'time',
    name: 'Time',
    category: 'temporal',
    baseType: 'string',
    nullable: true,
    defaultFormat: { type: 'time', pattern: 'HH:mm:ss' },
    validators: [{ type: 'isTime' }],
    icon: '⏰',
    color: '#f59e0b',
    description: 'Time of day',
  },
  duration: {
    id: 'duration',
    name: 'Duration',
    category: 'temporal',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'duration' },
    dimension: 'time',
    defaultUnit: 's',
    validators: [{ type: 'isNumber' }, { type: 'min', value: 0 }],
    icon: '⏱️',
    color: '#f59e0b',
    description: 'Time span or duration',
  },

  // ═══════════════════════════════════════════════════════════════
  // TEXT
  // ═══════════════════════════════════════════════════════════════
  text: {
    id: 'text',
    name: 'Text',
    category: 'text',
    baseType: 'string',
    nullable: true,
    defaultFormat: { type: 'text' },
    validators: [],
    icon: 'Aa',
    color: '#6b7280',
    description: 'Plain text',
  },
  richtext: {
    id: 'richtext',
    name: 'Rich Text',
    category: 'text',
    baseType: 'string',
    nullable: true,
    defaultFormat: { type: 'richtext' },
    validators: [],
    icon: '📝',
    color: '#6b7280',
    description: 'Formatted text with styles',
  },
  code: {
    id: 'code',
    name: 'Code',
    category: 'text',
    baseType: 'string',
    nullable: true,
    defaultFormat: { type: 'code', language: 'javascript' },
    validators: [],
    icon: '</>',
    color: '#6366f1',
    description: 'Source code snippet',
  },

  // ═══════════════════════════════════════════════════════════════
  // MEASUREMENT
  // ═══════════════════════════════════════════════════════════════
  length: {
    id: 'length',
    name: 'Length',
    category: 'measurement',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'unit', unit: 'm' },
    dimension: 'length',
    defaultUnit: 'm',
    validators: [{ type: 'isNumber' }],
    icon: '📏',
    color: '#ec4899',
    description: 'Distance or length measurement',
  },
  mass: {
    id: 'mass',
    name: 'Mass',
    category: 'measurement',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'unit', unit: 'kg' },
    dimension: 'mass',
    defaultUnit: 'kg',
    validators: [{ type: 'isNumber' }, { type: 'min', value: 0 }],
    icon: '⚖️',
    color: '#ec4899',
    description: 'Weight or mass',
  },
  temperature: {
    id: 'temperature',
    name: 'Temperature',
    category: 'measurement',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'unit', unit: '°C' },
    dimension: 'temperature',
    defaultUnit: 'celsius',
    validators: [{ type: 'isNumber' }],
    icon: '🌡️',
    color: '#ef4444',
    description: 'Temperature value',
  },
  area: {
    id: 'area',
    name: 'Area',
    category: 'measurement',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'unit', unit: 'm²' },
    dimension: 'area',
    defaultUnit: 'm2',
    validators: [{ type: 'isNumber' }, { type: 'min', value: 0 }],
    icon: '⬛',
    color: '#ec4899',
    description: 'Surface area',
  },
  volume: {
    id: 'volume',
    name: 'Volume',
    category: 'measurement',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'unit', unit: 'L' },
    dimension: 'volume',
    defaultUnit: 'liter',
    validators: [{ type: 'isNumber' }, { type: 'min', value: 0 }],
    icon: '🧊',
    color: '#ec4899',
    description: 'Capacity or volume',
  },
  speed: {
    id: 'speed',
    name: 'Speed',
    category: 'measurement',
    baseType: 'number',
    nullable: true,
    defaultFormat: { type: 'unit', unit: 'km/h' },
    dimension: 'speed',
    defaultUnit: 'km/h',
    validators: [{ type: 'isNumber' }, { type: 'min', value: 0 }],
    icon: '🚀',
    color: '#ec4899',
    description: 'Velocity or speed',
  },

  // ═══════════════════════════════════════════════════════════════
  // CONTACT
  // ═══════════════════════════════════════════════════════════════
  email: {
    id: 'email',
    name: 'Email',
    category: 'contact',
    baseType: 'string',
    nullable: true,
    defaultFormat: { type: 'email' },
    validators: [{ type: 'email' }],
    icon: '📧',
    color: '#06b6d4',
    description: 'Email address',
  },
  phone: {
    id: 'phone',
    name: 'Phone',
    category: 'contact',
    baseType: 'string',
    nullable: true,
    defaultFormat: { type: 'phone' },
    validators: [{ type: 'phone' }],
    icon: '📱',
    color: '#06b6d4',
    description: 'Phone number',
  },
  url: {
    id: 'url',
    name: 'URL',
    category: 'contact',
    baseType: 'string',
    nullable: true,
    defaultFormat: { type: 'url' },
    validators: [{ type: 'url' }],
    icon: '🔗',
    color: '#06b6d4',
    description: 'Web URL',
  },

  // ═══════════════════════════════════════════════════════════════
  // BOOLEAN
  // ═══════════════════════════════════════════════════════════════
  boolean: {
    id: 'boolean',
    name: 'Yes/No',
    category: 'boolean',
    baseType: 'boolean',
    nullable: true,
    defaultFormat: { type: 'boolean', trueLabel: 'Yes', falseLabel: 'No' },
    validators: [{ type: 'isBoolean' }],
    icon: '✓',
    color: '#10b981',
    description: 'True/False value',
  },
  checkbox: {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'boolean',
    baseType: 'boolean',
    nullable: false,
    defaultFormat: { type: 'checkbox' },
    validators: [{ type: 'isBoolean' }],
    icon: '☑️',
    color: '#10b981',
    description: 'Checkbox toggle',
  },

  // ═══════════════════════════════════════════════════════════════
  // GEOGRAPHIC
  // ═══════════════════════════════════════════════════════════════
  coordinates: {
    id: 'coordinates',
    name: 'Coordinates',
    category: 'geographic',
    baseType: 'object',
    nullable: true,
    defaultFormat: { type: 'coordinates' },
    validators: [{ type: 'coordinates' }],
    icon: '📍',
    color: '#14b8a6',
    description: 'Latitude/Longitude pair',
  },
  country: {
    id: 'country',
    name: 'Country',
    category: 'geographic',
    baseType: 'string',
    nullable: true,
    defaultFormat: { type: 'country' },
    validators: [{ type: 'country' }],
    icon: '🌍',
    color: '#14b8a6',
    description: 'Country name or code',
  },

  // ═══════════════════════════════════════════════════════════════
  // IDENTIFIER
  // ═══════════════════════════════════════════════════════════════
  uuid: {
    id: 'uuid',
    name: 'UUID',
    category: 'identifier',
    baseType: 'string',
    nullable: true,
    defaultFormat: { type: 'uuid' },
    validators: [{ type: 'uuid' }],
    icon: '🆔',
    color: '#64748b',
    description: 'Universal unique identifier',
  },
};

// -----------------------------------------------------------------------------
// Type Category Info
// -----------------------------------------------------------------------------

export interface TypeCategoryInfo {
  id: TypeCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const TYPE_CATEGORIES: TypeCategoryInfo[] = [
  { id: 'numeric', name: 'Numeric', icon: '#', color: '#3b82f6', description: 'Numbers and calculations' },
  { id: 'financial', name: 'Financial', icon: '$', color: '#22c55e', description: 'Currency and accounting' },
  { id: 'temporal', name: 'Temporal', icon: '📅', color: '#f59e0b', description: 'Dates and times' },
  { id: 'text', name: 'Text', icon: 'Aa', color: '#6b7280', description: 'Text and strings' },
  { id: 'measurement', name: 'Measurement', icon: '📏', color: '#ec4899', description: 'Physical units' },
  { id: 'contact', name: 'Contact', icon: '📧', color: '#06b6d4', description: 'Contact information' },
  { id: 'boolean', name: 'Boolean', icon: '✓', color: '#10b981', description: 'Yes/No values' },
  { id: 'geographic', name: 'Geographic', icon: '🌍', color: '#14b8a6', description: 'Location data' },
  { id: 'identifier', name: 'Identifier', icon: '🆔', color: '#64748b', description: 'Unique identifiers' },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

export function getTypesByCategory(category: TypeCategory): SemanticType[] {
  return Object.values(BUILT_IN_TYPES).filter((t) => t.category === category);
}

export function getTypeById(id: string): SemanticType | undefined {
  return BUILT_IN_TYPES[id];
}

export function isNumericType(type: SemanticType): boolean {
  return type.baseType === 'number';
}

export function hasDimension(type: SemanticType): boolean {
  return type.dimension !== undefined;
}
