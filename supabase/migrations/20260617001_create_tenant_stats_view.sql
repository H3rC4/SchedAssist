-- Migration: Create tenant_appointment_stats view for dashboard performance
-- Replaces client-side aggregation of ALL appointments

CREATE OR REPLACE VIEW tenant_appointment_stats AS
SELECT 
  tenant_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'pending' OR status = 'awaiting_confirmation') as pending,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE start_at >= CURRENT_DATE AND start_at < CURRENT_DATE + INTERVAL '1 day') as today,
  COUNT(*) FILTER (WHERE start_at >= DATE_TRUNC('month', CURRENT_DATE)) as this_month
FROM appointments
GROUP BY tenant_id;

-- RPC function for dashboard chart data (last 7 days)
CREATE OR REPLACE FUNCTION get_daily_appointment_counts(tenant_id_param UUID, days_back INT DEFAULT 7)
RETURNS TABLE(date TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(d::DATE, 'YYYY-MM-DD') as date,
    COUNT(a.id)::BIGINT as count
  FROM generate_series(
    CURRENT_DATE - (days_back - 1)::INT,
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) d
  LEFT JOIN appointments a ON 
    a.tenant_id = tenant_id_param AND 
    DATE(a.start_at) = d::DATE
  GROUP BY d::DATE
  ORDER BY d::DATE;
END;
$$ LANGUAGE plpgsql;

-- Índices para queries frecuentes que mejoran performance general
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date 
ON appointments(tenant_id, start_at);

CREATE INDEX IF NOT EXISTS idx_clients_tenant 
ON clients(tenant_id);

CREATE INDEX IF NOT EXISTS idx_professionals_tenant 
ON professionals(tenant_id);
