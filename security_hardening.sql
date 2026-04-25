-- ========================================================================================
-- SECURITY HARDENING SCRIPT
-- This script enables Row Level Security (RLS) on all core tables to enforce
-- strict tenant isolation and prevent unauthorized data access.
-- ========================================================================================

-- 1. TENANTS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can update their own tenant" ON public.tenants;

CREATE POLICY "Users can view their own tenant" 
ON public.tenants FOR SELECT 
USING (id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own tenant" 
ON public.tenants FOR UPDATE 
USING (id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 2. TENANT_USERS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view members of their tenant" ON public.tenant_users;

CREATE POLICY "Users can view members of their tenant" 
ON public.tenant_users FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 3. CLIENTS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select clients of their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients to their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients of their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients of their tenant" ON public.clients;

CREATE POLICY "Users can select clients of their tenant" ON public.clients FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert clients to their tenant" ON public.clients FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can update clients of their tenant" ON public.clients FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete clients of their tenant" ON public.clients FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 4. APPOINTMENTS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select appointments of their tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert appointments to their tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can update appointments of their tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete appointments of their tenant" ON public.appointments;

CREATE POLICY "Users can select appointments of their tenant" ON public.appointments FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert appointments to their tenant" ON public.appointments FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can update appointments of their tenant" ON public.appointments FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete appointments of their tenant" ON public.appointments FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 5. SERVICES
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select services of their tenant" ON public.services;
DROP POLICY IF EXISTS "Users can insert services to their tenant" ON public.services;
DROP POLICY IF EXISTS "Users can update services of their tenant" ON public.services;
DROP POLICY IF EXISTS "Users can delete services of their tenant" ON public.services;

CREATE POLICY "Users can select services of their tenant" ON public.services FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert services to their tenant" ON public.services FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can update services of their tenant" ON public.services FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete services of their tenant" ON public.services FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 6. PROFESSIONALS
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select professionals of their tenant" ON public.professionals;
DROP POLICY IF EXISTS "Users can insert professionals to their tenant" ON public.professionals;
DROP POLICY IF EXISTS "Users can update professionals of their tenant" ON public.professionals;
DROP POLICY IF EXISTS "Users can delete professionals of their tenant" ON public.professionals;

CREATE POLICY "Users can select professionals of their tenant" ON public.professionals FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert professionals to their tenant" ON public.professionals FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can update professionals of their tenant" ON public.professionals FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete professionals of their tenant" ON public.professionals FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 7. AVAILABILITY_RULES
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select availability_rules of their tenant" ON public.availability_rules;
DROP POLICY IF EXISTS "Users can insert availability_rules to their tenant" ON public.availability_rules;
DROP POLICY IF EXISTS "Users can update availability_rules of their tenant" ON public.availability_rules;
DROP POLICY IF EXISTS "Users can delete availability_rules of their tenant" ON public.availability_rules;

CREATE POLICY "Users can select availability_rules of their tenant" ON public.availability_rules FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert availability_rules to their tenant" ON public.availability_rules FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can update availability_rules of their tenant" ON public.availability_rules FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete availability_rules of their tenant" ON public.availability_rules FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 8. BLOCKED_SLOTS
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select blocked_slots of their tenant" ON public.blocked_slots;
DROP POLICY IF EXISTS "Users can insert blocked_slots to their tenant" ON public.blocked_slots;
DROP POLICY IF EXISTS "Users can update blocked_slots of their tenant" ON public.blocked_slots;
DROP POLICY IF EXISTS "Users can delete blocked_slots of their tenant" ON public.blocked_slots;

CREATE POLICY "Users can select blocked_slots of their tenant" ON public.blocked_slots FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert blocked_slots to their tenant" ON public.blocked_slots FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can update blocked_slots of their tenant" ON public.blocked_slots FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete blocked_slots of their tenant" ON public.blocked_slots FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 9. WHATSAPP_ACCOUNTS
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select whatsapp_accounts of their tenant" ON public.whatsapp_accounts;
DROP POLICY IF EXISTS "Users can insert whatsapp_accounts to their tenant" ON public.whatsapp_accounts;
DROP POLICY IF EXISTS "Users can update whatsapp_accounts of their tenant" ON public.whatsapp_accounts;
DROP POLICY IF EXISTS "Users can delete whatsapp_accounts of their tenant" ON public.whatsapp_accounts;

CREATE POLICY "Users can select whatsapp_accounts of their tenant" ON public.whatsapp_accounts FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert whatsapp_accounts to their tenant" ON public.whatsapp_accounts FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can update whatsapp_accounts of their tenant" ON public.whatsapp_accounts FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete whatsapp_accounts of their tenant" ON public.whatsapp_accounts FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 10. STRICTER CLINICAL RECORDS (Optional enhancement)
DROP POLICY IF EXISTS "Users can update clinical records of their tenant" ON public.clinical_records;
DROP POLICY IF EXISTS "Users can delete clinical records of their tenant" ON public.clinical_records;

CREATE POLICY "Users can update clinical records of their tenant" ON public.clinical_records FOR UPDATE 
USING (
  tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()) AND
  (
    (SELECT role FROM public.tenant_users WHERE user_id = auth.uid() AND tenant_id = clinical_records.tenant_id LIMIT 1) IN ('admin', 'owner', 'tenant_admin') 
    OR 
    professional_id = (SELECT id FROM public.professionals WHERE user_id = auth.uid() LIMIT 1)
  )
);

CREATE POLICY "Users can delete clinical records of their tenant" ON public.clinical_records FOR DELETE 
USING (
  tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()) AND
  (
    (SELECT role FROM public.tenant_users WHERE user_id = auth.uid() AND tenant_id = clinical_records.tenant_id LIMIT 1) IN ('admin', 'owner', 'tenant_admin') 
    OR 
    professional_id = (SELECT id FROM public.professionals WHERE user_id = auth.uid() LIMIT 1)
  )
);
