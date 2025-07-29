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

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
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
  const handleInputChange = (field: keyof typeof data, value: string) => {
    setInputValues(prev => ({ ...prev, [field]: value }));
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    const newData = {
      ...data,
      [field]: numValue
    };
    setData(newData);
    saveData(newData);
  };

  const handleInputFocus = (field: keyof typeof data) => {
    setFocusedField(field);
    setInputValues(prev => ({ ...prev, [field]: '' }));
  };

  const handleInputBlur = (field: keyof typeof data) => {
    setFocusedField(null);
    // If input is empty, show the actual value
    if (inputValues[field] === '') {
      setInputValues(prev => ({ ...prev, [field]: data[field].toString() }));
    }
  };

  const getInputValue = (field: keyof typeof data) => {
    if (focusedField === field) {
      return inputValues[field] || '';
    }
    return data[field].toString();
  };
  const getComplianceColor = () => {
    if (compliancePercentage === 100) return "text-blue-600"; // Outstanding: 100%
    if (compliancePercentage >= 98) return "text-green-600"; // Good: 98-100%
    if (compliancePercentage >= 90) return "text-amber-600"; // Needs improvement: 90-97%
    return "text-red-600"; // Inadequate: Below 90%
  };
  return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service Users by Risk Level */}
        <Card className="p-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="high-risk" className="text-sm font-medium">High:</Label>
              <Input id="high-risk" type="number" value={getInputValue('highRisk')} onChange={e => handleInputChange('highRisk', e.target.value)} onFocus={() => handleInputFocus('highRisk')} onBlur={() => handleInputBlur('highRisk')} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="medium-risk" className="text-sm font-medium">Medium:</Label>
              <Input id="medium-risk" type="number" value={getInputValue('mediumRisk')} onChange={e => handleInputChange('mediumRisk', e.target.value)} onFocus={() => handleInputFocus('mediumRisk')} onBlur={() => handleInputBlur('mediumRisk')} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low-risk" className="text-sm font-medium">Low:</Label>
              <Input id="low-risk" type="number" value={getInputValue('lowRisk')} onChange={e => handleInputChange('lowRisk', e.target.value)} onFocus={() => handleInputFocus('lowRisk')} onBlur={() => handleInputBlur('lowRisk')} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="na-risk" className="text-sm font-medium">N/A:</Label>
              <Input id="na-risk" type="number" value={getInputValue('naRisk')} onChange={e => handleInputChange('naRisk', e.target.value)} onFocus={() => handleInputFocus('naRisk')} onBlur={() => handleInputBlur('naRisk')} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
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
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              
            </div>
            <Input id="overdue" type="number" value={getInputValue('overdue')} onChange={e => handleInputChange('overdue', e.target.value)} onFocus={() => handleInputFocus('overdue')} onBlur={() => handleInputBlur('overdue')} min="0" max={totalServiceUsers} className="w-24 h-12 text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            <div className="text-xs text-muted-foreground text-center">
              Number overdue
            </div>
          </div>
        </Card>

        {/* Compliance Percentage */}
        <Card className="p-6">
          
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