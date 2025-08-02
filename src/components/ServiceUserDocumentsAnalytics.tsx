import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRobustAnalytics } from "@/hooks/useRobustAnalytics";
import { supabase } from "@/integrations/supabase/client";
interface ServiceUserDocumentsAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}
export const ServiceUserDocumentsAnalytics = ({
  meetingDate,
  meetingId
}: ServiceUserDocumentsAnalyticsProps) => {
  const {
    profile
  } = useAuth();
  const [data, setData] = useState({
    incompleteDocuments: 0
  });
  const [totalServiceUsers, setTotalServiceUsers] = useState(0);
  const compliancePercentage = totalServiceUsers > 0 ? Math.round((totalServiceUsers - data.incompleteDocuments) / totalServiceUsers * 100) : 100;
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
      loadCarePlanData();
    }
  }, [profile?.company_id, meetingId]);
  const loadData = async () => {
    if (!profile?.company_id) return;
    
    try {
      // Load data for the specific meeting if meetingId is provided, otherwise load company-wide data
      let query = supabase
        .from('service_user_document_analytics')
        .select('*')
        .eq('company_id', profile.company_id);
      
      if (meetingId) {
        query = query.eq('meeting_id', meetingId);
      } else {
        query = query.is('meeting_id', null);
      }
      
      const { data: savedData, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading service user documents:', error);
        return;
      }

      if (savedData) {
        setData({
          incompleteDocuments: savedData.incomplete_documents || 0
        });
        setTotalServiceUsers(savedData.total_service_users || 0);
      } else {
        // Try to load from localStorage backup
        const backupKey = meetingId ? `service_user_documents_backup_${profile.company_id}_${meetingId}` : `service_user_documents_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            setData(backup.data || { incompleteDocuments: 0 });
            setTotalServiceUsers(backup.totalServiceUsers || 0);
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading service user documents:', error);
      // Try to load from localStorage backup
      const backupKey = meetingId ? `service_user_documents_backup_${profile.company_id}_${meetingId}` : `service_user_documents_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backup = JSON.parse(backupData);
          setData(backup.data || { incompleteDocuments: 0 });
          setTotalServiceUsers(backup.totalServiceUsers || 0);
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };
  const loadCarePlanData = async () => {
    if (!profile?.company_id) return;
    try {
      // Use the same approach as CarePlanOverview to get care plan data
      const {
        data: carePlanData,
        error
      } = await supabase.from('dashboard_data').select('data_content').eq('company_id', profile.company_id).eq('data_type', 'care_plan_overview').maybeSingle();
      if (carePlanData?.data_content) {
        const careData = carePlanData.data_content as any;
        const total = (careData.highRisk || 0) + (careData.mediumRisk || 0) + (careData.lowRisk || 0) + (careData.naRisk || 0);
        setTotalServiceUsers(total);
        console.log('ServiceUserDocuments: Loaded care plan data, total service users:', total);
      } else {
        // Try to load from localStorage backup (same as CarePlanOverview)
        const backupKey = `care_plan_overview_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            const total = (backup.highRisk || 0) + (backup.mediumRisk || 0) + (backup.lowRisk || 0) + (backup.naRisk || 0);
            setTotalServiceUsers(total);
            console.log('ServiceUserDocuments: Loaded care plan data from backup, total service users:', total);
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        } else {
          console.log('ServiceUserDocuments: No care plan data found');
        }
      }
    } catch (error) {
      console.error('Error loading care plan data:', error);
    }
  };
  const saveData = async (newData: typeof data) => {
    if (!profile?.company_id) return;
    
    try {
      const { error } = await supabase
        .from('service_user_document_analytics')
        .upsert({
          company_id: profile.company_id,
          meeting_id: meetingId || null,
          incomplete_documents: newData.incompleteDocuments,
          total_service_users: totalServiceUsers,
          updated_at: new Date().toISOString()
        }, {
          onConflict: meetingId ? 'company_id,meeting_id' : 'company_id'
        });

      if (error) {
        console.error('Error saving service user documents:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        const backupKey = meetingId ? `service_user_documents_backup_${profile.company_id}_${meetingId}` : `service_user_documents_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, JSON.stringify({ data: newData, totalServiceUsers }));
      }
    } catch (error) {
      console.error('Error saving service user documents:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        const backupKey = meetingId ? `service_user_documents_backup_${profile.company_id}_${meetingId}` : `service_user_documents_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, JSON.stringify({ data: newData, totalServiceUsers }));
      }
    }
  };
  const EditableCell = ({
    value,
    onChange
  }: {
    value: number;
    onChange: (value: number) => void;
  }) => {
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
      return <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={e => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setEditing(false);
      }} className="w-16 h-8 text-sm bg-stone-50 text-black" autoFocus />;
    }
    return <span className="cursor-pointer hover:bg-accent/50 p-1 rounded" onClick={handleStartEdit}>
        {value}
      </span>;
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
        {/* Total Service Users */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 h-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Total Service Users</h3>
            </div>
            <div className="text-3xl font-bold text-primary">
              {totalServiceUsers}
            </div>
          </div>
        </Card>

        {/* Incomplete Documents */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 h-full">
            <div className="text-center">
              
            </div>
            <Input 
              id="incomplete-documents" 
              type="number" 
              value={data.incompleteDocuments === 0 ? '' : data.incompleteDocuments.toString()} 
              onChange={e => handleInputChange('incompleteDocuments', parseInt(e.target.value) || 0)} 
              min="0" 
              max={totalServiceUsers}
              className="w-24 h-12 text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50 text-black" 
            />
            <div className="text-xs text-muted-foreground text-center">
              Service users with incomplete documents
            </div>
          </div>
        </Card>

        {/* Compliance Percentage */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 h-full">
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
    </div>;
};