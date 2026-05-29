CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_attributes_gin ON notes USING gin (attributes);
CREATE INDEX idx_notes_flow_created ON notes(flow_id, created_at DESC);