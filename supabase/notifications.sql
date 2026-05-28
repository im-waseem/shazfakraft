-- =====================================================
-- Notifications Table for Admin Dashboard
-- Run in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL CHECK (type IN ('new_order', 'low_stock', 'new_customer', 'general')),
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  data        JSONB       NOT NULL DEFAULT '{}',
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast unread lookups
CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at  ON notifications (created_at DESC);

-- Row-Level Security: only admins can read/write notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read notifications"
  ON notifications FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update notifications"
  ON notifications FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin can delete notifications"
  ON notifications FOR DELETE
  USING (is_admin());

-- Enable Realtime on notifications table so the bell component
-- can receive live updates via Supabase channels.
-- Run this in Supabase Dashboard → Database → Replication if
-- the table is not already in the replication publication:
--   ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
