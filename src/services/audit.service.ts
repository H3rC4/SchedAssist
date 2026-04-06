import { createClient } from '@/lib/supabase/server'
import { AuditLog } from '@/types'

export class AuditService {
  /**
   * Logs an action to the audit_logs table.
   */
  static async logAction(params: {
    tenant_id: string;
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id: string;
    old_value?: any;
    new_value?: any;
  }) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('audit_logs')
      .insert([
        {
          tenant_id: params.tenant_id,
          user_id: params.user_id,
          action: params.action,
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          old_value: params.old_value,
          new_value: params.new_value,
        }
      ])

    if (error) {
      console.error('Failed to create audit log:', error)
    }
  }
}
