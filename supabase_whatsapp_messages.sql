-- Migration: WhatsApp Chat History Table
-- Purpose: Store all inbound/outbound WhatsApp messages for the dashboard chat UI
-- Created: 2026-05-11

-- 1. Create the main messages table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  content TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT CHECK (sender_type IN ('bot', 'manual', NULL)),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_phone 
  ON public.whatsapp_messages(tenant_id, phone_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_created 
  ON public.whatsapp_messages(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client 
  ON public.whatsapp_messages(client_id, created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view messages of their tenant
CREATE POLICY "Users can view whatsapp_messages of their tenant"
  ON public.whatsapp_messages
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
  );

-- Service role can insert all messages (used by webhooks and API routes)
CREATE POLICY "Service role can insert whatsapp_messages"
  ON public.whatsapp_messages
  FOR INSERT
  WITH CHECK (true);

-- Service role can update status
CREATE POLICY "Service role can update whatsapp_messages"
  ON public.whatsapp_messages
  FOR UPDATE
  USING (true);

-- 5. Add realtime publication (optional, for live chat updates)
-- Note: Run this in Supabase dashboard SQL editor if realtime is configured
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
