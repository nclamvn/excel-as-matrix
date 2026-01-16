// =============================================================================
// TYPE REGISTRY — Register and manage semantic types (Blueprint §3.1)
// =============================================================================

import {
  BUILT_IN_TYPES,
  TYPE_CATEGORIES,
  type SemanticType,
  type TypeCategory,
  type TypeCategoryInfo,
  type Dimension,
} from './types';

// -----------------------------------------------------------------------------
// Custom Type Definition
// -----------------------------------------------------------------------------

export interface CustomTypeDefinition {
  id: string;
  name: string;
  category: TypeCategory;
  basedOn?: string; // ID of type to extend
  validators?: SemanticType['validators'];
  defaultFormat?: SemanticType['defaultFormat'];
  icon?: string;
  color?: string;
  description?: string;
}

// -----------------------------------------------------------------------------
// Type Registry Class
// -----------------------------------------------------------------------------

export class TypeRegistry {
  private customTypes: Map<string, SemanticType> = new Map();

  /**
   * Get all available types (built-in + custom)
   */
  getAllTypes(): SemanticType[] {
    return [...Object.values(BUILT_IN_TYPES), ...this.customTypes.values()];
  }

  /**
   * Get a type by ID
   */
  getType(id: string): SemanticType | undefined {
    return BUILT_IN_TYPES[id] || this.customTypes.get(id);
  }

  /**
   * Check if a type exists
   */
  hasType(id: string): boolean {
    return id in BUILT_IN_TYPES || this.customTypes.has(id);
  }

  /**
   * Get types by category
   */
  getTypesByCategory(category: TypeCategory): SemanticType[] {
    return this.getAllTypes().filter((t) => t.category === category);
  }

  /**
   * Get types by dimension
   */
  getTypesByDimension(dimension: Dimension): SemanticType[] {
    return this.getAllTypes().filter((t) => t.dimension === dimension);
  }

  /**
   * Get all categories
   */
  getCategories(): TypeCategoryInfo[] {
    return TYPE_CATEGORIES;
  }

  /**
   * Register a custom type
   */
  registerType(definition: CustomTypeDefinition): SemanticType {
    const baseType = definition.basedOn ? this.getType(definition.basedOn) : undefined;

    const newType: SemanticType = {
      id: definition.id,
      name: definition.name,
      category: definition.category,
      baseType: baseType?.baseType || 'string',
      nullable: baseType?.nullable ?? true,
      defaultFormat: definition.defaultFormat || baseType?.defaultFormat || { type: 'text' },
      validators: definition.validators || baseType?.validators || [],
      dimension: baseType?.dimension,
      defaultUnit: baseType?.defaultUnit,
      icon: definition.icon || baseType?.icon || '📄',
      color: definition.color || baseType?.color || '#6b7280',
      description: definition.description || `Custom type: ${definition.name}`,
    };

    this.customTypes.set(definition.id, newType);
    return newType;
  }

  /**
   * Unregister a custom type
   */
  unregisterType(id: string): boolean {
    return this.customTypes.delete(id);
  }

  /**
   * Clear all custom types
   */
  clearCustomTypes(): void {
    this.customTypes.clear();
  }

  /**
   * Get all custom types
   */
  getCustomTypes(): SemanticType[] {
    return [...this.customTypes.values()];
  }

  /**
   * Get built-in types only
   */
  getBuiltInTypes(): SemanticType[] {
    return Object.values(BUILT_IN_TYPES);
  }

  /**
   * Search types by name or ID
   */
  searchTypes(query: string): SemanticType[] {
    const q = query.toLowerCase();
    return this.getAllTypes().filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }

  /**
   * Get suggested types for a value
   */
  getSuggestedTypes(value: unknown): SemanticType[] {
    const suggestions: SemanticType[] = [];

    // Basic type matching
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        suggestions.push(BUILT_IN_TYPES.integer);
      }
      suggestions.push(BUILT_IN_TYPES.number);
      suggestions.push(BUILT_IN_TYPES.currency);
      suggestions.push(BUILT_IN_TYPES.percentage);
    } else if (typeof value === 'boolean') {
      suggestions.push(BUILT_IN_TYPES.boolean);
      suggestions.push(BUILT_IN_TYPES.checkbox);
    } else if (value instanceof Date) {
      suggestions.push(BUILT_IN_TYPES.datetime);
      suggestions.push(BUILT_IN_TYPES.date);
    } else if (typeof value === 'string') {
      // Check patterns
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        suggestions.push(BUILT_IN_TYPES.email);
      }
      if (/^https?:\/\//.test(value)) {
        suggestions.push(BUILT_IN_TYPES.url);
      }
      if (/^\+?[\d\s\-()]{7,}$/.test(value)) {
        suggestions.push(BUILT_IN_TYPES.phone);
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        suggestions.push(BUILT_IN_TYPES.date);
      }
      suggestions.push(BUILT_IN_TYPES.text);
    }

    return suggestions;
  }

  /**
   * Clone a type with modifications
   */
  cloneType(id: string, newId: string, modifications: Partial<SemanticType>): SemanticType | null {
    const original = this.getType(id);
    if (!original) return null;

    const cloned: SemanticType = {
      ...original,
      ...modifications,
      id: newId,
    };

    this.customTypes.set(newId, cloned);
    return cloned;
  }

  /**
   * Export types as JSON
   */
  exportTypes(): string {
    const types = {
      builtIn: Object.keys(BUILT_IN_TYPES),
      custom: Object.fromEntries(this.customTypes),
    };
    return JSON.stringify(types, null, 2);
  }

  /**
   * Import custom types from JSON
   */
  importTypes(json: string): number {
    try {
      const data = JSON.parse(json);
      let count = 0;

      if (data.custom && typeof data.custom === 'object') {
        for (const [id, type] of Object.entries(data.custom)) {
          if (this.isValidType(type as SemanticType)) {
            this.customTypes.set(id, type as SemanticType);
            count++;
          }
        }
      }

      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Validate a type definition
   */
  private isValidType(type: unknown): type is SemanticType {
    if (!type || typeof type !== 'object') return false;
    const t = type as Record<string, unknown>;
    return (
      typeof t.id === 'string' &&
      typeof t.name === 'string' &&
      typeof t.category === 'string' &&
      typeof t.baseType === 'string'
    );
  }
}

// Export singleton instance
export const typeRegistry = new TypeRegistry();
