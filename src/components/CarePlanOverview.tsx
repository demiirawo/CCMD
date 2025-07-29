import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
interface CarePlanOverviewProps {
  meetingDate?: Date;
  meetingId?: string;
}
export const CarePlanOverview = ({
  meetingDate,
  meetingId
}: CarePlanOverviewProps) => {
  const {
    profile
  } = useAuth();
  const [data, setData] = useState({
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    naRisk: 0,
    overdue: 0
  });
  const totalServiceUsers = data.highRisk + data.mediumRisk + data.lowRisk + data.naRisk;
  const compliancePercentage = totalServiceUsers > 0 ? Math.round((totalServiceUsers - data.overdue) / totalServiceUsers * 100) : 100;
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id, meetingId]);
  const loadData = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        data: savedData,
        error
      } = await supabase.from('dashboard_data').select('data_content').eq('company_id', profile.company_id).eq('data_type', 'care_plan_overview').maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading care plan overview:', error);
        return;
      }
      if (savedData?.data_content) {
        setData(savedData.data_content as typeof data);
      } else {
        // Try to load from localStorage backup
        const backupKey = `care_plan_overview_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            setData(backup);
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading care plan overview:', error);
      // Try to load from localStorage backup
      const backupKey = `care_plan_overview_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backup = JSON.parse(backupData);
          setData(backup);
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };
  const saveData = async (newData: typeof data) => {
    if (!profile?.company_id) return;
    try {
      const {
        error
      } = await supabase.from('dashboard_data').upsert({
        company_id: profile.company_id,
        meeting_id: meetingId,
        data_type: 'care_plan_overview',
        data_content: newData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,meeting_id,data_type'
      });
      if (error) {
        console.error('Error saving care plan overview:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        localStorage.setItem(`care_plan_overview_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving care plan overview:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        localStorage.setItem(`care_plan_overview_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    }
  };
  const handleInputChange = (field: keyof typeof data, value: number) => {
    const newData = {
      ...data,
      [field]: value
    };
    setData(newData);
    saveData(newData);
  };
  const getComplianceColor = () => {
    if (compliancePercentage >= 95) return "text-green-600";
    if (compliancePercentage >= 85) return "text-yellow-600";
    return "text-red-600";
  };
  return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service Users by Risk Level */}
        <Card className="p-6">
          <h5 className="text-md font-medium mb-4 text-foreground">Service Users by Risk Level</h5>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="high-risk" className="text-sm font-medium">High Risk:</Label>
              <Input id="high-risk" type="number" value={data.highRisk} onChange={e => handleInputChange('highRisk', parseInt(e.target.value) || 0)} className="w-20 h-8 text-center" min="0" />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="low-risk" className="text-sm font-medium">Low Risk:</Label>
              <Input id="low-risk" type="number" value={data.lowRisk} onChange={e => handleInputChange('lowRisk', parseInt(e.target.value) || 0)} className="w-20 h-8 text-center" min="0" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="na-risk" className="text-sm font-medium">N/A:</Label>
              <Input id="na-risk" type="number" value={data.naRisk} onChange={e => handleInputChange('naRisk', parseInt(e.target.value) || 0)} className="w-20 h-8 text-center" min="0" />
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between font-medium">
                <span>Total:</span>
                <span className="text-primary">{totalServiceUsers}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Overdue Care Plans */}
        <Card className="p-6">
          <h5 className="text-md font-medium mb-4 text-foreground">Overdue Care Plans</h5>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <Label htmlFor="overdue" className="text-sm font-medium">Plans Overdue:</Label>
            </div>
            <Input id="overdue" type="number" value={data.overdue} onChange={e => handleInputChange('overdue', parseInt(e.target.value) || 0)} className="w-24 h-12 text-center text-lg font-semibold" min="0" max={totalServiceUsers} />
            <div className="text-xs text-muted-foreground text-center">
              Out of {totalServiceUsers} total service users
            </div>
          </div>
        </Card>

        {/* Compliance Percentage */}
        <Card className="p-6">
          <h5 className="text-md font-medium mb-4 text-foreground">Compliance Rate</h5>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`text-4xl font-bold ${getComplianceColor()}`}>
              {compliancePercentage}%
            </div>
            <div className="text-sm text-center text-muted-foreground">
              Care Plans Compliant
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {totalServiceUsers - data.overdue} compliant / {totalServiceUsers} total
            </div>
          </div>
        </Card>
      </div>
    </div>;
};