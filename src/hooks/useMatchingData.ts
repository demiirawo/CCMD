import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Generate week labels for the next 8 weeks
const getNext8Weeks = () => {
  const weeks: string[] = [];
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(startOfWeek.getDate() + (i * 7));
    weeks.push(weekStart.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    }));
  }
  return weeks;
};

export const WEEKS = getNext8Weeks();

export interface WeeklyForecast {
  [week: string]: number;
}

export interface StaffAllocation {
  staffId: string;
  allocatedHours: WeeklyForecast;
  confirmedNeeds: string[];
  confirmedInterests: string[];
}

export type GenderPreference = "No Preference" | "Male" | "Female";
export type Gender = "Male" | "Female" | "Non-Binary" | "Prefer not to say";
export type ContractType = 
  | "Full-Time Contract"
  | "Part-Time Contract"
  | "Zero-Hours Contract"
  | "Fixed-Term Contract"
  | "Agency or Temporary Contract"
  | "Self-Employed/Independent Contractor"
  | "Apprenticeship Agreement"
  | "Bank Contract (Casual Staff)"
  | "Volunteer";

export interface ServiceUser {
  id: string;
  name: string;
  supportNeeds: string[];
  preferences: string[];
  genderPreference: GenderPreference;
  location: string;
  typicalWeeklyHours: number;
  primaryStaffIds: string[];
  backupStaffIds: string[];
  forecastHours: WeeklyForecast;
  staffAllocations: StaffAllocation[];
}

export interface Staff {
  id: string;
  name: string;
  gender: Gender;
  location: string;
  availability: string;
  status: "Active" | "On Leave" | "Inactive";
  typicalWeeklyHours: number;
  contractType: ContractType;
  forecastHours: WeeklyForecast;
}

// Helper to create default forecast hours
export const createDefaultForecast = (baseHours: number = 0): WeeklyForecast => {
  const forecast: WeeklyForecast = {};
  WEEKS.forEach(week => {
    forecast[week] = baseHours;
  });
  return forecast;
};

export const useMatchingData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const companyId = profile?.company_id;

  // Load data from database
  const loadData = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch staff
      const { data: staffData, error: staffError } = await supabase
        .from('matching_staff')
        .select('*')
        .eq('company_id', companyId);

      if (staffError) throw staffError;

      // Fetch service users
      const { data: usersData, error: usersError } = await supabase
        .from('matching_service_users')
        .select('*')
        .eq('company_id', companyId);

      if (usersError) throw usersError;

      // Transform staff data
      const transformedStaff: Staff[] = (staffData || []).map(s => ({
        id: s.id,
        name: s.name,
        gender: s.gender as Gender,
        location: s.location,
        availability: 'Full-time',
        status: s.status as "Active" | "On Leave" | "Inactive",
        typicalWeeklyHours: Number(s.typical_weekly_hours),
        contractType: s.contract_type as ContractType,
        forecastHours: (s.forecast_hours as WeeklyForecast) || createDefaultForecast(Number(s.typical_weekly_hours))
      }));

      // Transform service users data
      const transformedUsers: ServiceUser[] = (usersData || []).map(u => ({
        id: u.id,
        name: u.name,
        location: u.location,
        genderPreference: u.gender_preference as GenderPreference,
        supportNeeds: (u.support_needs as string[]) || [],
        preferences: (u.preferences as string[]) || [],
        typicalWeeklyHours: Number(u.typical_weekly_hours),
        forecastHours: (u.forecast_hours as WeeklyForecast) || createDefaultForecast(Number(u.typical_weekly_hours)),
        primaryStaffIds: (u.primary_staff_ids as string[]) || [],
        backupStaffIds: (u.backup_staff_ids as string[]) || [],
        staffAllocations: (u.staff_allocations as unknown as StaffAllocation[]) || []
      }));

      setStaff(transformedStaff);
      setServiceUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading matching data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load matching data from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  // Save staff member
  const saveStaff = useCallback(async (staffMember: Staff) => {
    if (!companyId) return;

    try {
      const { error } = await supabase
        .from('matching_staff')
        .upsert({
          id: staffMember.id,
          company_id: companyId,
          name: staffMember.name,
          location: staffMember.location,
          gender: staffMember.gender,
          contract_type: staffMember.contractType,
          status: staffMember.status,
          typical_weekly_hours: staffMember.typicalWeeklyHours,
          forecast_hours: staffMember.forecastHours
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving staff:', error);
      throw error;
    }
  }, [companyId]);

  // Save service user
  const saveServiceUser = useCallback(async (user: ServiceUser) => {
    if (!companyId) return;

    try {
      const { error } = await supabase
        .from('matching_service_users')
        .upsert({
          id: user.id,
          company_id: companyId,
          name: user.name,
          location: user.location,
          gender_preference: user.genderPreference,
          support_needs: user.supportNeeds as unknown as null,
          preferences: user.preferences as unknown as null,
          typical_weekly_hours: user.typicalWeeklyHours,
          forecast_hours: user.forecastHours as unknown as null,
          primary_staff_ids: user.primaryStaffIds as unknown as null,
          backup_staff_ids: user.backupStaffIds as unknown as null,
          staff_allocations: user.staffAllocations as unknown as null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving service user:', error);
      throw error;
    }
  }, [companyId]);

  // Delete staff member
  const deleteStaff = useCallback(async (staffId: string) => {
    if (!companyId) return;

    try {
      const { error } = await supabase
        .from('matching_staff')
        .delete()
        .eq('id', staffId)
        .eq('company_id', companyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  }, [companyId]);

  // Delete service user
  const deleteServiceUser = useCallback(async (userId: string) => {
    if (!companyId) return;

    try {
      const { error } = await supabase
        .from('matching_service_users')
        .delete()
        .eq('id', userId)
        .eq('company_id', companyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting service user:', error);
      throw error;
    }
  }, [companyId]);

  // Add new staff member
  const addStaff = useCallback(async (newStaff: Omit<Staff, 'id'>) => {
    if (!companyId) return null;

    try {
      const { data, error } = await supabase
        .from('matching_staff')
        .insert({
          company_id: companyId,
          name: newStaff.name,
          location: newStaff.location,
          gender: newStaff.gender,
          contract_type: newStaff.contractType,
          status: newStaff.status,
          typical_weekly_hours: newStaff.typicalWeeklyHours,
          forecast_hours: newStaff.forecastHours
        })
        .select()
        .single();

      if (error) throw error;

      const staffMember: Staff = {
        id: data.id,
        name: data.name,
        gender: data.gender as Gender,
        location: data.location,
        availability: 'Full-time',
        status: data.status as "Active" | "On Leave" | "Inactive",
        typicalWeeklyHours: Number(data.typical_weekly_hours),
        contractType: data.contract_type as ContractType,
        forecastHours: (data.forecast_hours as WeeklyForecast) || createDefaultForecast(Number(data.typical_weekly_hours))
      };

      setStaff(prev => [...prev, staffMember]);
      return staffMember;
    } catch (error) {
      console.error('Error adding staff:', error);
      throw error;
    }
  }, [companyId]);

  // Add new service user
  const addServiceUser = useCallback(async (newUser: Omit<ServiceUser, 'id'>) => {
    if (!companyId) return null;

    try {
      const { data, error } = await supabase
        .from('matching_service_users')
        .insert({
          company_id: companyId,
          name: newUser.name,
          location: newUser.location,
          gender_preference: newUser.genderPreference,
          support_needs: newUser.supportNeeds as unknown as null,
          preferences: newUser.preferences as unknown as null,
          typical_weekly_hours: newUser.typicalWeeklyHours,
          forecast_hours: newUser.forecastHours as unknown as null,
          primary_staff_ids: newUser.primaryStaffIds as unknown as null,
          backup_staff_ids: newUser.backupStaffIds as unknown as null,
          staff_allocations: newUser.staffAllocations as unknown as null
        })
        .select()
        .single();

      if (error) throw error;

      const user: ServiceUser = {
        id: data.id,
        name: data.name,
        location: data.location,
        genderPreference: data.gender_preference as GenderPreference,
        supportNeeds: (data.support_needs as string[]) || [],
        preferences: (data.preferences as string[]) || [],
        typicalWeeklyHours: Number(data.typical_weekly_hours),
        forecastHours: (data.forecast_hours as WeeklyForecast) || createDefaultForecast(Number(data.typical_weekly_hours)),
        primaryStaffIds: (data.primary_staff_ids as string[]) || [],
        backupStaffIds: (data.backup_staff_ids as string[]) || [],
        staffAllocations: (data.staff_allocations as unknown as StaffAllocation[]) || []
      };

      setServiceUsers(prev => [...prev, user]);
      return user;
    } catch (error) {
      console.error('Error adding service user:', error);
      throw error;
    }
  }, [companyId]);

  // Update staff in local state and save to database
  const updateStaff = useCallback(async (updatedStaff: Staff) => {
    setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
    await saveStaff(updatedStaff);
  }, [saveStaff]);

  // Update service user in local state and save to database
  const updateServiceUser = useCallback(async (updatedUser: ServiceUser) => {
    setServiceUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    await saveServiceUser(updatedUser);
  }, [saveServiceUser]);

  // Bulk update for staff (used when updating multiple items)
  const updateStaffLocal = useCallback((updater: (prev: Staff[]) => Staff[]) => {
    setStaff(updater);
  }, []);

  // Bulk update for service users (used when updating multiple items)
  const updateServiceUsersLocal = useCallback((updater: (prev: ServiceUser[]) => ServiceUser[]) => {
    setServiceUsers(updater);
  }, []);

  // Save all pending changes
  const saveAllChanges = useCallback(async () => {
    if (!companyId) return;

    setSaving(true);
    try {
      // Save all staff
      for (const s of staff) {
        await saveStaff(s);
      }
      // Save all service users
      for (const u of serviceUsers) {
        await saveServiceUser(u);
      }
      toast({
        title: "Changes saved",
        description: "All matching data has been saved"
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error saving",
        description: "Failed to save some changes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [companyId, staff, serviceUsers, saveStaff, saveServiceUser, toast]);

  // Load data on mount and when company changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save with debounce
  useEffect(() => {
    if (!companyId || loading) return;

    const timeoutId = setTimeout(() => {
      saveAllChanges();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [staff, serviceUsers]);

  return {
    serviceUsers,
    staff,
    loading,
    saving,
    setServiceUsers: updateServiceUsersLocal,
    setStaff: updateStaffLocal,
    addStaff,
    addServiceUser,
    updateStaff,
    updateServiceUser,
    deleteStaff,
    deleteServiceUser,
    saveAllChanges,
    loadData
  };
};
