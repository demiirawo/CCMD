import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ServiceUserDocumentsAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const ServiceUserDocumentsAnalytics = ({
  meetingDate,
  meetingId
}: ServiceUserDocumentsAnalyticsProps) => {
  const { profile } = useAuth();
  
  const [data, setData] = useState({
    incompleteDocuments: 0
  });

  const [totalServiceUsers, setTotalServiceUsers] = useState(0);

  const compliancePercentage = totalServiceUsers > 0 
    ? Math.round((totalServiceUsers - data.incompleteDocuments) / totalServiceUsers * 100) 
    : 100;

  useEffect(() => {
    if (profile?.company_id) {
      loadData();
      loadCarePlanData();
    }
  }, [profile?.company_id, meetingId]);

  const loadData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data: savedData, error } = await supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', profile.company_id)
        .eq('data_type', 'service_user_documents')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading service user documents:', error);
        return;
      }

      if (savedData?.data_content) {
        setData(savedData.data_content as typeof data);
      } else {
        // Try to load from localStorage backup
        const backupKey = `service_user_documents_backup_${profile.company_id}`;
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
      console.error('Error loading service user documents:', error);
      // Try to load from localStorage backup
      const backupKey = `service_user_documents_backup_${profile.company_id}`;
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

  const loadCarePlanData = async () => {
    if (!profile?.company_id) return;

    try {
      // Get the most recent care plan data for this company
      const { data: carePlanData, error } = await supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', profile.company_id)
        .eq('data_type', 'care_plan_overview')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (carePlanData?.data_content) {
        const careData = carePlanData.data_content as any;
        const total = (careData.highRisk || 0) + (careData.mediumRisk || 0) + (careData.lowRisk || 0) + (careData.naRisk || 0);
        setTotalServiceUsers(total);
        console.log('ServiceUserDocuments: Loaded care plan data, total service users:', total);
      } else {
        console.log('ServiceUserDocuments: No care plan data found');
      }
    } catch (error) {
      console.error('Error loading care plan data:', error);
    }
  };

  const saveData = async (newData: typeof data) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('dashboard_data')
        .upsert({
          company_id: profile.company_id,
          meeting_id: meetingId,
          data_type: 'service_user_documents',
          data_content: newData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,meeting_id,data_type'
        });

      if (error) {
        console.error('Error saving service user documents:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        localStorage.setItem(`service_user_documents_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving service user documents:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        localStorage.setItem(`service_user_documents_backup_${profile.company_id}`, JSON.stringify(newData));
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
          className="w-16 h-8 text-sm"
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

  const handleInputChange = (field: keyof typeof data, value: number) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    saveData(newData);
  };

  const getComplianceColor = () => {
    if (compliancePercentage >= 95) return "text-green-600";
    if (compliancePercentage >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Service Users */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Total Service Users</h3>
            </div>
            <div className="text-3xl font-bold text-primary">
              {totalServiceUsers}
            </div>
            <div className="text-xs text-muted-foreground text-center">
              From Care Plans & Risk Assessments
            </div>
          </div>
        </Card>

        {/* Incomplete Documents */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Incomplete Documents</h3>
            </div>
            <EditableCell 
              value={data.incompleteDocuments} 
              onChange={(value) => handleInputChange('incompleteDocuments', value)} 
            />
            <div className="text-xs text-muted-foreground text-center">
              Service users with incomplete documents
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
              Documents Compliant
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {totalServiceUsers - data.incompleteDocuments} compliant / {totalServiceUsers} total
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};