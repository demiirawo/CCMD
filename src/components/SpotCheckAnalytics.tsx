import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRobustAnalytics } from "@/hooks/useRobustAnalytics";
import { supabase } from "@/integrations/supabase/client";

interface SpotCheckAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const SpotCheckAnalytics = ({
  meetingDate,
  meetingId
}: SpotCheckAnalyticsProps) => {
  const { profile } = useAuth();

  // Staff data from resourcing overview (probation staff only)
  const [staffData, setStaffData] = useState({
    onProbation: 0,
    active: 0 // "Passed Probation" staff
  });

  // Spot check data
  const [spotCheckData, setSpotCheckData] = useState({
    overdueSpotChecks: 0
  });

  const totalStaffNeedingSpotChecks = staffData.onProbation + staffData.active;
  const spotCheckCompliance = totalStaffNeedingSpotChecks > 0 ? Math.round((totalStaffNeedingSpotChecks - spotCheckData.overdueSpotChecks) / totalStaffNeedingSpotChecks * 100) : 100;

  useEffect(() => {
    if (profile?.company_id) {
      loadStaffData();
      loadSpotCheckData();
    }
  }, [profile?.company_id, meetingId]);

  // Listen for resourcing data updates
  useEffect(() => {
    const handleResourcingUpdate = (event: CustomEvent) => {
      if (event.detail.companyId === profile?.company_id && 
          event.detail.meetingId === meetingId) {
        console.log('SpotCheckAnalytics: Received resourcing data update:', event.detail.data);
        setStaffData({
          onProbation: event.detail.data.onProbation || 0,
          active: event.detail.data.active || 0
        });
      }
    };

    window.addEventListener('resourcing-data-updated', handleResourcingUpdate as EventListener);
    return () => window.removeEventListener('resourcing-data-updated', handleResourcingUpdate as EventListener);
  }, [profile?.company_id, meetingId]);

  const loadStaffData = async () => {
    if (!profile?.company_id) return;

    try {
      console.log('SpotCheckAnalytics: Loading staff data for company:', profile.company_id, 'meetingId:', meetingId);
      
      // Load data for the specific meeting if meetingId is provided, otherwise load company-wide data
      let query = supabase.from('dashboard_data').select('data_content').eq('company_id', profile.company_id).eq('data_type', 'resourcing_overview');
      if (meetingId) {
        query = query.eq('meeting_id', meetingId);
      } else {
        query = query.is('meeting_id', null);
      }

      const { data: savedData, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('SpotCheckAnalytics: Error loading staff data:', error);
        return;
      }

      console.log('SpotCheckAnalytics: Raw data received:', savedData);

      if (savedData?.data_content) {
        const resourcingData = savedData.data_content as any;
        console.log('SpotCheckAnalytics: Resourcing data:', resourcingData);
        
        const newStaffData = {
          onProbation: resourcingData.onProbation || 0,
          active: resourcingData.active || 0
        };
        
        console.log('SpotCheckAnalytics: Setting staff data:', newStaffData);
        setStaffData(newStaffData);
      } else {
        console.log('SpotCheckAnalytics: No data found, checking for any resourcing_overview data');
        
        // Fallback: check for any resourcing data without meeting_id filter
        const { data: fallbackData } = await supabase
          .from('dashboard_data')
          .select('data_content')
          .eq('company_id', profile.company_id)
          .eq('data_type', 'resourcing_overview')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (fallbackData?.data_content) {
          const resourcingData = fallbackData.data_content as any;
          console.log('SpotCheckAnalytics: Using fallback data:', resourcingData);
          setStaffData({
            onProbation: resourcingData.onProbation || 0,
            active: resourcingData.active || 0
          });
        }
      }
    } catch (error) {
      console.error('SpotCheckAnalytics: Error loading staff data:', error);
    }
  };

  const loadSpotCheckData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase.from('dashboard_data').select('data_content').eq('company_id', profile.company_id).eq('data_type', 'spot_check_analytics').maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading spot check data:', error);
        return;
      }

      if (data?.data_content) {
        setSpotCheckData(data.data_content as typeof spotCheckData);
      } else {
        // Try localStorage backup
        const backupKey = `spot_check_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            setSpotCheckData(backup);
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading spot check data:', error);
      // Try localStorage backup
      const backupKey = `spot_check_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backup = JSON.parse(backupData);
          setSpotCheckData(backup);
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };

  const saveSpotCheckData = async (newData: typeof spotCheckData) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase.from('dashboard_data').upsert({
        company_id: profile.company_id,
        meeting_id: meetingId,
        data_type: 'spot_check_analytics',
        data_content: newData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,meeting_id,data_type'
      });

      if (error) {
        console.error('Error saving spot check data:', error);
        throw error;
      } else {
        // Save backup to localStorage
        localStorage.setItem(`spot_check_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving spot check data:', error);
      // Fallback to localStorage
      if (profile?.company_id) {
        localStorage.setItem(`spot_check_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    }
  };

  const EditableCell = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const handleStartEdit = () => {
      setEditing(true);
      setEditValue('');
    };

    const handleSave = () => {
      const numValue = parseInt(editValue) || 0;
      onChange(numValue);
      setEditing(false);
    };

    if (editing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-16 h-8 text-sm bg-stone-50 text-black"
          autoFocus
        />
      );
    }

    return (
      <span className="cursor-pointer hover:bg-accent/50 p-1 rounded" onClick={handleStartEdit}>
        {value}
      </span>
    );
  };

  const handleOverdueChange = (value: number) => {
    const newData = {
      ...spotCheckData,
      overdueSpotChecks: value
    };
    setSpotCheckData(newData);
    saveSpotCheckData(newData);
  };

  const getComplianceColor = () => {
    if (spotCheckCompliance === 100) return "text-blue-600"; // Outstanding: 100%
    if (spotCheckCompliance >= 98) return "text-green-600"; // Good: 98-100%
    if (spotCheckCompliance >= 90) return "text-amber-600"; // Needs improvement: 90-97%
    return "text-red-600"; // Inadequate: Below 90%
  };

  const getComplianceStatus = () => {
    if (spotCheckCompliance === 100) return "Outstanding";
    if (spotCheckCompliance >= 98) return "Good";
    if (spotCheckCompliance >= 90) return "Needs Improvement";
    return "Inadequate";
  };

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Staff Requiring Spot Checks */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">On Probation:</span>
              <span className="text-lg text-primary">{staffData.onProbation}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Passed Probation:</span>
              <span className="text-lg text-primary">{staffData.active}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between font-medium">
                <span>Total Staff:</span>
                <span className="text-primary">{totalStaffNeedingSpotChecks}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Overdue Spot Checks */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Overdue Spot Checks</h3>
            </div>
            <EditableCell 
              value={spotCheckData.overdueSpotChecks} 
              onChange={handleOverdueChange} 
            />
            <div className="text-xs text-muted-foreground text-center">
              Number of overdue spot checks
            </div>
          </div>
        </Card>

        {/* Spot Check Compliance */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`text-4xl font-bold ${getComplianceColor()}`}>
              {spotCheckCompliance}%
            </div>
            <div className="text-sm text-center text-muted-foreground">
              {getComplianceStatus()}
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {totalStaffNeedingSpotChecks - spotCheckData.overdueSpotChecks} up to date / {totalStaffNeedingSpotChecks} total
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};