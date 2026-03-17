// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE STORAGE LAYER
// CRUD operations for workbooks, sheets, cells with Realtime subscriptions
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DBWorkbook {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  settings: Record<string, unknown>;
}

export interface DBSheet {
  id: string;
  workbook_id: string;
  name: string;
  index: number;
  tab_color: string | null;
  hidden: boolean;
  protected: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DBCell {
  id: string;
  sheet_id: string;
  row_index: number;
  col_index: number;
  value: unknown;
  formula: string | null;
  display_value: string;
  format: Record<string, unknown> | null;
  version: number;
  updated_at: string;
  updated_by: string | null;
}

export interface CellChange {
  sheetId: string;
  row: number;
  col: number;
  value: unknown;
  formula: string | null;
  displayValue: string;
  format?: Record<string, unknown>;
}

type CellChangeListener = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: DBCell | null;
  old: DBCell | null;
}) => void;

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Storage Class
// ─────────────────────────────────────────────────────────────────────────────

class SupabaseStorage {
  private channels: Map<string, RealtimeChannel> = new Map();

  private get client() {
    if (!supabase) throw new Error('Supabase client not initialized');
    return supabase;
  }

  get isAvailable(): boolean {
    return supabase !== null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKBOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  async listWorkbooks(): Promise<DBWorkbook[]> {
    const { data, error } = await this.client
      .from('workbooks')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getWorkbook(id: string): Promise<DBWorkbook | null> {
    const { data, error } = await this.client
      .from('workbooks')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createWorkbook(name: string, ownerId: string): Promise<DBWorkbook> {
    const { data, error } = await this.client
      .from('workbooks')
      .insert({ name, owner_id: ownerId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWorkbook(id: string, updates: Partial<Pick<DBWorkbook, 'name' | 'settings'>>): Promise<DBWorkbook> {
    const { data, error } = await this.client
      .from('workbooks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWorkbook(id: string): Promise<void> {
    const { error } = await this.client
      .from('workbooks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEETS
  // ═══════════════════════════════════════════════════════════════════════════

  async getSheets(workbookId: string): Promise<DBSheet[]> {
    const { data, error } = await this.client
      .from('sheets')
      .select('*')
      .eq('workbook_id', workbookId)
      .order('index', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async createSheet(workbookId: string, name: string, index: number): Promise<DBSheet> {
    const { data, error } = await this.client
      .from('sheets')
      .insert({ workbook_id: workbookId, name, index })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSheet(id: string, updates: Partial<Pick<DBSheet, 'name' | 'index' | 'tab_color' | 'hidden' | 'protected' | 'settings'>>): Promise<DBSheet> {
    const { data, error } = await this.client
      .from('sheets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSheet(id: string): Promise<void> {
    const { error } = await this.client
      .from('sheets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CELLS
  // ═══════════════════════════════════════════════════════════════════════════

  async getCells(sheetId: string): Promise<DBCell[]> {
    const { data, error } = await this.client
      .from('cells')
      .select('*')
      .eq('sheet_id', sheetId);

    if (error) throw error;
    return data ?? [];
  }

  async getCellsSince(sheetId: string, since: string): Promise<DBCell[]> {
    const { data, error } = await this.client
      .from('cells')
      .select('*')
      .eq('sheet_id', sheetId)
      .gt('updated_at', since);

    if (error) throw error;
    return data ?? [];
  }

  async upsertCell(change: CellChange): Promise<DBCell> {
    const { data, error } = await this.client
      .from('cells')
      .upsert(
        {
          sheet_id: change.sheetId,
          row_index: change.row,
          col_index: change.col,
          value: change.value,
          formula: change.formula,
          display_value: change.displayValue,
          format: change.format ?? null,
        },
        { onConflict: 'sheet_id,row_index,col_index' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async upsertCellsBatch(changes: CellChange[]): Promise<void> {
    if (changes.length === 0) return;

    const rows = changes.map((c) => ({
      sheet_id: c.sheetId,
      row_index: c.row,
      col_index: c.col,
      value: c.value,
      formula: c.formula,
      display_value: c.displayValue,
      format: c.format ?? null,
    }));

    const { error } = await this.client
      .from('cells')
      .upsert(rows, { onConflict: 'sheet_id,row_index,col_index' });

    if (error) throw error;
  }

  async deleteCell(sheetId: string, row: number, col: number): Promise<void> {
    const { error } = await this.client
      .from('cells')
      .delete()
      .eq('sheet_id', sheetId)
      .eq('row_index', row)
      .eq('col_index', col);

    if (error) throw error;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REALTIME SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  subscribeToCells(sheetId: string, listener: CellChangeListener): () => void {
    const channelName = `cells:${sheetId}`;

    // Cleanup existing subscription
    this.unsubscribeFromCells(sheetId);

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cells',
          filter: `sheet_id=eq.${sheetId}`,
        },
        (payload) => {
          listener({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as DBCell | null,
            old: payload.old as DBCell | null,
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribeFromCells(sheetId);
  }

  private unsubscribeFromCells(sheetId: string): void {
    const channelName = `cells:${sheetId}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      this.client.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COLLABORATORS
  // ═══════════════════════════════════════════════════════════════════════════

  async addCollaborator(workbookId: string, userId: string, role: 'viewer' | 'editor' | 'admin' = 'editor'): Promise<void> {
    const { error } = await this.client
      .from('workbook_collaborators')
      .upsert({ workbook_id: workbookId, user_id: userId, role });

    if (error) throw error;
  }

  async removeCollaborator(workbookId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('workbook_collaborators')
      .delete()
      .eq('workbook_id', workbookId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  cleanup(): void {
    for (const [, channel] of this.channels) {
      this.client.removeChannel(channel);
    }
    this.channels.clear();
  }
}

// Export singleton
export const supabaseStorage = new SupabaseStorage();
