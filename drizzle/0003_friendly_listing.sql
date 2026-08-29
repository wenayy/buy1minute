ALTER TABLE ownerships ADD COLUMN reservation_id TEXT;
CREATE INDEX IF NOT EXISTS idx_ownerships_reservation_id ON ownerships (reservation_id);
