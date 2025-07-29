import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SupervisionAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const SupervisionAnalytics = ({
  meetingDate,
  meetingId
}: SupervisionAnalyticsProps) => {
  const { profile } = useAuth();

  // Staff data from resourcing overview (probation staff only)
  const [staffData, setStaffData] = useState({
    onProbation: 0,
    active: 0 // "Passed Probation" staff
  });

  // Supervision data
  const [supervisionData, setSupervisionData] = useState({
    overdueSupervisions: 0
  });

  const totalStaffNeedingSupervisions = staffData.onProbation + staffData.active;
  const supervisionCompliance = totalStaffNeedingSupervisions > 0 
    ? Math.round((totalStaffNeedingSupervisions - supervisionData.overdueSupervisions) / totalStaffNeedingSupervisions * 100) 
    : 100;

  useEffect(() => {
    if (profile?.company_id) {
      loadStaffData();
      loadSupervisionData();
    }
  }, [profile?.company_id, meetingId]);

  const loadStaffData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data: savedData, error } = await supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', profile.company_id)
        .eq('data_type', 'resourcing_overview')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading staff data:', error);
        return;
      }

      if (savedData?.data_content) {
        const resourcingData = savedData.data_content as any;
        setStaffData({
          onProbation: resourcingData.onProbation || 0,
          active: resourcingData.active || 0
        });
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  };

  const loadSupervisionData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', profile.company_id)
        .eq('data_type', 'supervision_analytics')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading supervision data:', error);
        return;
      }

      if (data?.data_content) {
        setSupervisionData(data.data_content as typeof supervisionData);
      } else {
        // Try localStorage backup
        const backupKey = `supervision_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            setSupervisionData(backup);
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading supervision data:', error);
      // Try localStorage backup
      const backupKey = `supervision_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backup = JSON.parse(backupData);
          setSupervisionData(backup);
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };

  const saveSupervisionData = async (newData: typeof supervisionData) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('dashboard_data')
        .upsert({
          company_id: profile.company_id,
          meeting_id: meetingId,
          data_type: 'supervision_analytics',
          data_content: newData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,meeting_id,data_type'
        });

      if (error) {
        console.error('Error saving supervision data:', error);
        throw error;
      } else {
        // Save backup to localStorage
        localStorage.setItem(`supervision_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving supervision data:', error);
      // Fallback to localStorage
      if (profile?.company_id) {
        localStorage.setItem(`supervision_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    }
  };

  const handleOverdueChange = (value: number) => {
    const newData = {
      ...supervisionData,
      overdueSupervisions: value
    };
    setSupervisionData(newData);
    saveSupervisionData(newData);
  };

  const getComplianceColor = () => {
    if (supervisionCompliance >= 98) return "text-green-600"; // Green: 98-100%
    if (supervisionCompliance >= 89) return "text-amber-600"; // Amber: 89-97%
    return "text-red-600"; // Red: Below 89%
  };

  const getComplianceStatus = () => {
    if (supervisionCompliance >= 98) return "Excellent";
    if (supervisionCompliance >= 89) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Staff Requiring Supervisions */}
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
                <span className="text-primary">{totalStaffNeedingSupervisions}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Overdue Supervisions */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <Label htmlFor="overdue-supervisions" className="text-sm font-medium">
                Overdue Count:
              </Label>
            </div>
            <Input
              id="overdue-supervisions"
              type="number"
              value={supervisionData.overdueSupervisions}
              onChange={(e) => handleOverdueChange(parseInt(e.target.value) || 0)}
              className="w-24 h-12 text-center text-lg font-semibold"
              min="0"
              max={totalStaffNeedingSupervisions}
            />
            <div className="text-xs text-muted-foreground text-center">
              Number of overdue supervisions
            </div>
          </div>
        </Card>

        {/* Supervision Compliance */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`text-4xl font-bold ${getComplianceColor()}`}>
              {supervisionCompliance}%
            </div>
            <div className="text-sm text-center text-muted-foreground">
              {getComplianceStatus()}
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {totalStaffNeedingSupervisions - supervisionData.overdueSupervisions} up to date / {totalStaffNeedingSupervisions} total
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};