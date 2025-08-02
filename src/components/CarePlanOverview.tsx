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

  // Store display values separately from data values
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});
  const totalServiceUsers = data.highRisk + data.mediumRisk + data.lowRisk + data.naRisk;
  const compliancePercentage = totalServiceUsers > 0 ? Math.round((totalServiceUsers - data.overdue) / totalServiceUsers * 100) : 100;
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id, meetingId]);
  const loadData = async () => {
    if (!profile?.company_id) return;
    
    console.log('🔍 CarePlanOverview: Loading data for company_id:', profile.company_id, 'meetingId:', meetingId);
    
    try {
      // Strategy: Load ALL care plan data for this company and consolidate the most recent data
      // This ensures we don't lose data due to meeting ID inconsistencies
      const { data: allData, error } = await supabase
        .from('care_plan_overview')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false });

      console.log('🔍 CarePlanOverview: Found all company data:', allData?.length || 0, 'records');
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading care plan overview:', error);
        return;
      }

      if (allData && allData.length > 0) {
        console.log('🔍 CarePlanOverview: Consolidating data from', allData.length, 'records');
        
        // Use the most recent non-zero values, prioritizing data from the current meeting if available
        let consolidatedData = {
          highRisk: 0,
          mediumRisk: 0,
          lowRisk: 0,
          naRisk: 0,
          overdue: 0
        };
        
        // Process all records to find the best values
        allData.forEach((record, index) => {
          console.log(`🔍 CarePlanOverview: Processing record ${index + 1}:`, record);
          
          // If this is the first record or if we find non-zero values, use them
          if (index === 0 || 
              (record.high_risk > 0 && consolidatedData.highRisk === 0) ||
              (record.medium_risk > 0 && consolidatedData.mediumRisk === 0) ||
              (record.low_risk > 0 && consolidatedData.lowRisk === 0) ||
              (record.na_risk > 0 && consolidatedData.naRisk === 0)) {
            
            consolidatedData = {
              highRisk: record.high_risk || consolidatedData.highRisk,
              mediumRisk: record.medium_risk || consolidatedData.mediumRisk,
              lowRisk: record.low_risk || consolidatedData.lowRisk,
              naRisk: record.na_risk || consolidatedData.naRisk,
              overdue: 0 // Note: overdue is not stored in new table structure
            };
          }
        });
        
        console.log('🔍 CarePlanOverview: Consolidated data:', consolidatedData);
        setData(consolidatedData);
        
        // Initialize display values with consolidated data (show numbers, but allow empty fields)
        setDisplayValues({
          highRisk: consolidatedData.highRisk === 0 ? '' : consolidatedData.highRisk.toString(),
          mediumRisk: consolidatedData.mediumRisk === 0 ? '' : consolidatedData.mediumRisk.toString(),
          lowRisk: consolidatedData.lowRisk === 0 ? '' : consolidatedData.lowRisk.toString(),
          naRisk: consolidatedData.naRisk === 0 ? '' : consolidatedData.naRisk.toString(),
          overdue: consolidatedData.overdue === 0 ? '' : consolidatedData.overdue.toString(),
        });
        console.log('✅ CarePlanOverview: Set consolidated data to state');
      } else {
        console.log('🔍 CarePlanOverview: No database data found, trying localStorage backup');
        // Try to load from localStorage backup
        const backupKey = meetingId ? `care_plan_overview_backup_${profile.company_id}_${meetingId}` : `care_plan_overview_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            setData(backup);
            // Initialize display values with backup data
            setDisplayValues({
              highRisk: backup.highRisk === 0 ? '' : backup.highRisk.toString(),
              mediumRisk: backup.mediumRisk === 0 ? '' : backup.mediumRisk.toString(),
              lowRisk: backup.lowRisk === 0 ? '' : backup.lowRisk.toString(),
              naRisk: backup.naRisk === 0 ? '' : backup.naRisk.toString(),
              overdue: backup.overdue === 0 ? '' : backup.overdue.toString(),
            });
            console.log('✅ CarePlanOverview: Loaded from localStorage backup');
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading care plan overview:', error);
      // Try to load from localStorage backup
      const backupKey = meetingId ? `care_plan_overview_backup_${profile.company_id}_${meetingId}` : `care_plan_overview_backup_${profile.company_id}`;
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
    
    console.log('🔄 CarePlanOverview: Starting save operation', {
      companyId: profile.company_id,
      meetingId,
      data: newData,
      timestamp: new Date().toISOString()
    });
    
    try {
      const { error } = await supabase
        .from('care_plan_overview')
        .upsert({
          company_id: profile.company_id,
          meeting_id: meetingId || null,
          high_risk: newData.highRisk,
          medium_risk: newData.mediumRisk,
          low_risk: newData.lowRisk,
          na_risk: newData.naRisk,
          updated_at: new Date().toISOString()
        }, {
          onConflict: meetingId ? 'company_id,meeting_id' : 'company_id'
        });

      if (error) {
        console.error('Error saving care plan overview:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        const backupKey = meetingId ? `care_plan_overview_backup_${profile.company_id}_${meetingId}` : `care_plan_overview_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving care plan overview:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        const backupKey = meetingId ? `care_plan_overview_backup_${profile.company_id}_${meetingId}` : `care_plan_overview_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, JSON.stringify(newData));
      }
    }
  };
  const handleInputChange = (field: keyof typeof data, value: string) => {
    // Update display value immediately
    setDisplayValues(prev => ({ ...prev, [field]: value }));
    
    // Convert to number for data storage (empty string becomes 0)
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    const newData = {
      ...data,
      [field]: numValue
    };
    setData(newData);
    saveData(newData);
  };

  const getDisplayValue = (field: keyof typeof data) => {
    return displayValues[field] ?? (data[field] === 0 ? '' : data[field].toString());
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
              <Input id="high-risk" type="number" value={getDisplayValue('highRisk')} onChange={e => handleInputChange('highRisk', e.target.value)} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="medium-risk" className="text-sm font-medium">Medium:</Label>
              <Input id="medium-risk" type="number" value={getDisplayValue('mediumRisk')} onChange={e => handleInputChange('mediumRisk', e.target.value)} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low-risk" className="text-sm font-medium">Low:</Label>
              <Input id="low-risk" type="number" value={getDisplayValue('lowRisk')} onChange={e => handleInputChange('lowRisk', e.target.value)} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="na-risk" className="text-sm font-medium">N/A:</Label>
              <Input id="na-risk" type="number" value={getDisplayValue('naRisk')} onChange={e => handleInputChange('naRisk', e.target.value)} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
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
            <Input id="overdue" type="number" value={getDisplayValue('overdue')} onChange={e => handleInputChange('overdue', e.target.value)} min="0" max={totalServiceUsers} className="w-24 h-12 text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
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