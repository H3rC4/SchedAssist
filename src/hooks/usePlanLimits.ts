"use client";

import { useState, useEffect } from 'react';
import { Tenant, PlanConfig } from '@/types';

interface PlanLimits {
  // Limits
  maxProfessionals: number;
  maxServices: number;
  maxLocations: number;
  maxAppointmentsPerMonth: number;
  maxPatients: number;
  
  // Features
  hasCustomDomain: boolean;
  hasWhiteLabel: boolean;
  hasApiAccess: boolean;
  analyticsTier: 'basic' | 'advanced' | 'custom';
  
  // WhatsApp
  whatsappNumbersCount: number;
  whatsappNumbersLimit: number;
  
  // Helpers
  canAddProfessional: (current: number) => boolean;
  canAddService: (current: number) => boolean;
  canAddLocation: (current: number) => boolean;
  canAddAppointment: (current: number) => boolean;
  canAddPatient: (current: number) => boolean;
  isUnlimitedProfessionals: boolean;
  isUnlimitedServices: boolean;
  isUnlimitedLocations: boolean;
  isUnlimitedAppointments: boolean;
  isUnlimitedPatients: boolean;
  
  // Loading state
  loading: boolean;
  error: string | null;
}

export function usePlanLimits(): PlanLimits {
  const [limits, setLimits] = useState<{
    max_professionals: number;
    max_services: number;
    max_locations: number;
    max_appointments_per_month: number;
    max_patients: number;
    custom_domain_enabled: boolean;
    white_label_enabled: boolean;
    api_access_enabled: boolean;
    analytics_tier: 'basic' | 'advanced' | 'custom';
    whatsapp_numbers_count: number;
    whatsapp_numbers_limit: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch('/api/tenant/plan');
        if (!res.ok) throw new Error('Failed to fetch plan');
        const data = await res.json();
        
        setLimits({
          max_professionals: data.limits?.max_professionals ?? 5,
          max_services: data.limits?.max_services ?? -1,
          max_locations: data.limits?.max_locations ?? 2,
          max_appointments_per_month: data.limits?.max_appointments_per_month ?? -1,
          max_patients: data.limits?.max_patients ?? -1,
          custom_domain_enabled: data.features?.custom_domain ?? false,
          white_label_enabled: data.features?.white_label ?? false,
          api_access_enabled: data.features?.api_access ?? true,
          analytics_tier: data.features?.analytics_tier ?? 'advanced',
          whatsapp_numbers_count: data.whatsapp?.count ?? 1,
          whatsapp_numbers_limit: data.whatsapp?.limit ?? 1,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlan();
  }, []);

  if (loading) {
    return {
      maxProfessionals: 5,
      maxServices: -1,
      maxLocations: 2,
      maxAppointmentsPerMonth: -1,
      maxPatients: -1,
      hasCustomDomain: false,
      hasWhiteLabel: false,
      hasApiAccess: true,
      analyticsTier: 'advanced',
      whatsappNumbersCount: 1,
      whatsappNumbersLimit: 1,
      canAddProfessional: () => true,
      canAddService: () => true,
      canAddLocation: () => true,
      canAddAppointment: () => true,
      canAddPatient: () => true,
      isUnlimitedProfessionals: false,
      isUnlimitedServices: true,
      isUnlimitedLocations: false,
      isUnlimitedAppointments: true,
      isUnlimitedPatients: true,
      loading: true,
      error: null,
    };
  }

  if (error || !limits) {
    return {
      maxProfessionals: 5,
      maxServices: -1,
      maxLocations: 2,
      maxAppointmentsPerMonth: -1,
      maxPatients: -1,
      hasCustomDomain: false,
      hasWhiteLabel: false,
      hasApiAccess: true,
      analyticsTier: 'advanced',
      whatsappNumbersCount: 1,
      whatsappNumbersLimit: 1,
      canAddProfessional: () => true,
      canAddService: () => true,
      canAddLocation: () => true,
      canAddAppointment: () => true,
      canAddPatient: () => true,
      isUnlimitedProfessionals: false,
      isUnlimitedServices: true,
      isUnlimitedLocations: false,
      isUnlimitedAppointments: true,
      isUnlimitedPatients: true,
      loading: false,
      error: error || 'Unknown error',
    };
  }

  return {
    maxProfessionals: limits.max_professionals,
    maxServices: limits.max_services,
    maxLocations: limits.max_locations,
    maxAppointmentsPerMonth: limits.max_appointments_per_month,
    maxPatients: limits.max_patients,
    hasCustomDomain: limits.custom_domain_enabled,
    hasWhiteLabel: limits.white_label_enabled,
    hasApiAccess: limits.api_access_enabled,
    analyticsTier: limits.analytics_tier,
    whatsappNumbersCount: limits.whatsapp_numbers_count,
    whatsappNumbersLimit: limits.whatsapp_numbers_limit,
    
    canAddProfessional: (current: number) => 
      limits.max_professionals === -1 || current < limits.max_professionals,
    canAddService: (current: number) => 
      limits.max_services === -1 || current < limits.max_services,
    canAddLocation: (current: number) => 
      limits.max_locations === -1 || current < limits.max_locations,
    canAddAppointment: (current: number) => 
      limits.max_appointments_per_month === -1 || current < limits.max_appointments_per_month,
    canAddPatient: (current: number) => 
      limits.max_patients === -1 || current < limits.max_patients,
    
    isUnlimitedProfessionals: limits.max_professionals === -1,
    isUnlimitedServices: limits.max_services === -1,
    isUnlimitedLocations: limits.max_locations === -1,
    isUnlimitedAppointments: limits.max_appointments_per_month === -1,
    isUnlimitedPatients: limits.max_patients === -1,
    
    loading: false,
    error: null,
  };
}
