"use client"

import { X, User, Phone, Briefcase, MessageSquare, Trash2 } from 'lucide-react'
import { Appointment } from '@/hooks/useAppointments'

interface AppointmentDetailModalProps {
  appointment: Appointment;
  onClose: () => void;
  onCancel: (id: string) => void;
  translations: any;
}

export function AppointmentDetailModal({
  appointment,
  onClose,
  onCancel,
  translations: T
}: AppointmentDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-2xl animate-in fade-in duration-300 p-4" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-10">
            <div className="h-20 w-20 rounded-[2rem] bg-primary-600 shadow-2xl shadow-primary-200 flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <button onClick={onClose} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>
          <div className="space-y-8">
            <div>
              <h3 className="text-3xl font-black text-gray-900">{appointment.clients?.first_name} {appointment.clients?.last_name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-[10px] font-black rounded-lg uppercase tracking-widest">{appointment.services?.name}</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black rounded-lg uppercase tracking-widest">ID: {appointment.id.slice(0, 8)}</span>
              </div>
            </div>
            <div className="grid gap-4">
              {[
                { icon: Phone, label: T.phone, val: appointment.clients?.phone },
                { icon: Briefcase, label: T.professional, val: appointment.professionals?.full_name },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-5 p-5 rounded-3xl bg-gray-50 border border-gray-100">
                  <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm"><Icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-bold text-gray-700">{val}</p>
                  </div>
                </div>
              ))}
            </div>
            {appointment.notes && (
              <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 border-dashed text-amber-900">
                <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> {T.notes}</p>
                <p className="text-sm font-medium italic">"{appointment.notes}"</p>
              </div>
            )}
          </div>
          <div className="mt-12">
            <button onClick={() => onCancel(appointment.id)}
              className="w-full py-5 bg-red-50 text-red-600 font-black rounded-3xl hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
              <Trash2 className="h-5 w-5" /> {T.cancelBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
