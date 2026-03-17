-- ExcelAI Database Schema
-- Workbooks, Sheets, Cells with Row Level Security

-- ══════════════════════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS workbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Untitled Workbook',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workbook_id UUID NOT NULL REFERENCES workbooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Sheet1',
  index INTEGER NOT NULL DEFAULT 0,
  tab_color TEXT,
  hidden BOOLEAN NOT NULL DEFAULT false,
  protected BOOLEAN NOT NULL DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  col_index INTEGER NOT NULL,
  value JSONB,
  formula TEXT,
  display_value TEXT NOT NULL DEFAULT '',
  format JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(sheet_id, row_index, col_index)
);

CREATE TABLE IF NOT EXISTS workbook_collaborators (
  workbook_id UUID NOT NULL REFERENCES workbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workbook_id, user_id)
);

CREATE TABLE IF NOT EXISTS cell_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
  value JSONB,
  formula TEXT,
  version INTEGER NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX idx_sheets_workbook ON sheets(workbook_id);
CREATE INDEX idx_cells_sheet ON cells(sheet_id);
CREATE INDEX idx_cells_sheet_position ON cells(sheet_id, row_index, col_index);
CREATE INDEX idx_cells_updated ON cells(updated_at);
CREATE INDEX idx_workbooks_owner ON workbooks(owner_id);
CREATE INDEX idx_collaborators_user ON workbook_collaborators(user_id);
CREATE INDEX idx_cell_versions_cell ON cell_versions(cell_id);

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE workbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_versions ENABLE ROW LEVEL SECURITY;

-- Workbooks: owner or collaborator can access
CREATE POLICY workbooks_select ON workbooks FOR SELECT USING (
  owner_id = auth.uid()
  OR id IN (SELECT workbook_id FROM workbook_collaborators WHERE user_id = auth.uid())
);
CREATE POLICY workbooks_insert ON workbooks FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY workbooks_update ON workbooks FOR UPDATE USING (
  owner_id = auth.uid()
  OR id IN (SELECT workbook_id FROM workbook_collaborators WHERE user_id = auth.uid() AND role IN ('editor', 'admin'))
);
CREATE POLICY workbooks_delete ON workbooks FOR DELETE USING (owner_id = auth.uid());

-- Sheets: access if can access workbook
CREATE POLICY sheets_select ON sheets FOR SELECT USING (
  workbook_id IN (
    SELECT id FROM workbooks WHERE owner_id = auth.uid()
    UNION SELECT workbook_id FROM workbook_collaborators WHERE user_id = auth.uid()
  )
);
CREATE POLICY sheets_insert ON sheets FOR INSERT WITH CHECK (
  workbook_id IN (
    SELECT id FROM workbooks WHERE owner_id = auth.uid()
    UNION SELECT workbook_id FROM workbook_collaborators WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
  )
);
CREATE POLICY sheets_update ON sheets FOR UPDATE USING (
  workbook_id IN (
    SELECT id FROM workbooks WHERE owner_id = auth.uid()
    UNION SELECT workbook_id FROM workbook_collaborators WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
  )
);
CREATE POLICY sheets_delete ON sheets FOR DELETE USING (
  workbook_id IN (
    SELECT id FROM workbooks WHERE owner_id = auth.uid()
    UNION SELECT workbook_id FROM workbook_collaborators WHERE user_id = auth.uid() AND role = 'admin')
);

-- Cells: access through sheet -> workbook chain
CREATE POLICY cells_select ON cells FOR SELECT USING (
  sheet_id IN (
    SELECT s.id FROM sheets s
    JOIN workbooks w ON s.workbook_id = w.id
    LEFT JOIN workbook_collaborators wc ON w.id = wc.workbook_id AND wc.user_id = auth.uid()
    WHERE w.owner_id = auth.uid() OR wc.user_id IS NOT NULL
  )
);
CREATE POLICY cells_insert ON cells FOR INSERT WITH CHECK (
  sheet_id IN (
    SELECT s.id FROM sheets s
    JOIN workbooks w ON s.workbook_id = w.id
    LEFT JOIN workbook_collaborators wc ON w.id = wc.workbook_id AND wc.user_id = auth.uid()
    WHERE w.owner_id = auth.uid() OR (wc.user_id IS NOT NULL AND wc.role IN ('editor', 'admin'))
  )
);
CREATE POLICY cells_update ON cells FOR UPDATE USING (
  sheet_id IN (
    SELECT s.id FROM sheets s
    JOIN workbooks w ON s.workbook_id = w.id
    LEFT JOIN workbook_collaborators wc ON w.id = wc.workbook_id AND wc.user_id = auth.uid()
    WHERE w.owner_id = auth.uid() OR (wc.user_id IS NOT NULL AND wc.role IN ('editor', 'admin'))
  )
);
CREATE POLICY cells_delete ON cells FOR DELETE USING (
  sheet_id IN (
    SELECT s.id FROM sheets s
    JOIN workbooks w ON s.workbook_id = w.id
    LEFT JOIN workbook_collaborators wc ON w.id = wc.workbook_id AND wc.user_id = auth.uid()
    WHERE w.owner_id = auth.uid() OR (wc.user_id IS NOT NULL AND wc.role IN ('editor', 'admin'))
  )
);

-- Collaborators: visible to workbook members
CREATE POLICY collaborators_select ON workbook_collaborators FOR SELECT USING (
  workbook_id IN (
    SELECT id FROM workbooks WHERE owner_id = auth.uid()
    UNION SELECT workbook_id FROM workbook_collaborators WHERE user_id = auth.uid()
  )
);
CREATE POLICY collaborators_insert ON workbook_collaborators FOR INSERT WITH CHECK (
  workbook_id IN (SELECT id FROM workbooks WHERE owner_id = auth.uid())
);
CREATE POLICY collaborators_delete ON workbook_collaborators FOR DELETE USING (
  workbook_id IN (SELECT id FROM workbooks WHERE owner_id = auth.uid())
);

-- Cell versions: same as cells
CREATE POLICY cell_versions_select ON cell_versions FOR SELECT USING (
  cell_id IN (SELECT id FROM cells)
);
CREATE POLICY cell_versions_insert ON cell_versions FOR INSERT WITH CHECK (
  cell_id IN (SELECT id FROM cells)
);

-- ══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workbooks_updated_at BEFORE UPDATE ON workbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sheets_updated_at BEFORE UPDATE ON sheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cells_updated_at BEFORE UPDATE ON cells
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-version cells on update
CREATE OR REPLACE FUNCTION version_cell()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version
  NEW.version = COALESCE(OLD.version, 0) + 1;
  -- Store old version
  INSERT INTO cell_versions (cell_id, value, formula, version, changed_by)
  VALUES (OLD.id, OLD.value, OLD.formula, OLD.version, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cells_version BEFORE UPDATE ON cells
  FOR EACH ROW EXECUTE FUNCTION version_cell();

-- ══════════════════════════════════════════════════════════════
-- REALTIME
-- ══════════════════════════════════════════════════════════════

-- Enable Realtime for cells (change notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE cells;
ALTER PUBLICATION supabase_realtime ADD TABLE sheets;
