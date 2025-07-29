import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const chartConfig = {
  compliant: {
    label: "Fully Compliant",
    color: "hsl(var(--chart-1))",
  },
  pending: {
    label: "Pending Documents",
    color: "hsl(var(--chart-2))",
  },
};

interface StaffDocumentsAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const StaffDocumentsAnalytics = ({ meetingDate, meetingId }: StaffDocumentsAnalyticsProps) => {
  const { profile } = useAuth();
  useTheme();
  const [documentsData, setDocumentsData] = useState({
    activeFullyCompliant: 0,
    activePendingDocuments: 0,
    onboardingFullyCompliant: 0,
    onboardingPendingDocuments: 0
  });

  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id]);

  const loadData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('staff_documents_analytics')
        .select('*')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading staff documents analytics:', error);
        return;
      }

      if (data) {
        const savedData = (data.documents_data as any) || {};
        setDocumentsData({
          activeFullyCompliant: savedData.activeFullyCompliant || 0,
          activePendingDocuments: savedData.activePendingDocuments || 0,
          onboardingFullyCompliant: savedData.onboardingFullyCompliant || 0,
          onboardingPendingDocuments: savedData.onboardingPendingDocuments || 0
        });
      } else {
        // Try to load from localStorage backup
        const backupKey = `documents_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backupDocumentsData = JSON.parse(backupData);
            setDocumentsData(backupDocumentsData);
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading staff documents analytics:', error);
      // Try to load from localStorage backup
      const backupKey = `documents_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backupDocumentsData = JSON.parse(backupData);
          setDocumentsData(backupDocumentsData);
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };

  const saveData = async (newData: typeof documentsData) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('staff_documents_analytics')
        .upsert({
          company_id: profile.company_id,
          documents_data: newData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (error) {
        console.error('Error saving staff documents analytics:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        localStorage.setItem(`documents_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving staff documents analytics:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        localStorage.setItem(`documents_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    }
  };

  const handleInputChange = (field: keyof typeof documentsData, value: number) => {
    const newData = { ...documentsData, [field]: value };
    setDocumentsData(newData);
    saveData(newData);
  };

  const EditableInput = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const handleStartEdit = () => {
      setEditing(true);
      setEditValue(value.toString());
    };

    const handleSave = () => {
      const numValue = parseInt(editValue) || 0;
      onChange(numValue);
      setEditing(false);
    };

    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{label}:</span>
        {editing ? (
          <Input 
            value={editValue} 
            onChange={e => setEditValue(e.target.value)} 
            onBlur={handleSave} 
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setEditing(false);
            }} 
            className="w-20 h-8 text-sm" 
            autoFocus 
          />
        ) : (
          <span className="cursor-pointer hover:bg-accent/50 p-2 rounded text-sm border" onClick={handleStartEdit}>
            {value}
          </span>
        )}
      </div>
    );
  };

  const activeTotal = documentsData.activeFullyCompliant + documentsData.activePendingDocuments;
  const onboardingTotal = documentsData.onboardingFullyCompliant + documentsData.onboardingPendingDocuments;
  
  const barData = [
    {
      category: "Active Staff",
      compliant: documentsData.activeFullyCompliant,
      pending: documentsData.activePendingDocuments,
    },
    {
      category: "Onboarding Staff", 
      compliant: documentsData.onboardingFullyCompliant,
      pending: documentsData.onboardingPendingDocuments,
    },
  ].filter(item => item.compliant > 0 || item.pending > 0);

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Staff Documents Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Staff document compliance overview</div>
      
      {/* Input Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4 p-4 border rounded-lg">
          <h5 className="font-medium">Active Staff</h5>
          <div className="grid grid-cols-2 gap-4">
            <EditableInput 
              label="Fully Compliant" 
              value={documentsData.activeFullyCompliant} 
              onChange={(value) => handleInputChange('activeFullyCompliant', value)} 
            />
            <EditableInput 
              label="Pending Documents" 
              value={documentsData.activePendingDocuments} 
              onChange={(value) => handleInputChange('activePendingDocuments', value)} 
            />
          </div>
        </div>
        
        <div className="space-y-4 p-4 border rounded-lg">
          <h5 className="font-medium">Onboarding Staff</h5>
          <div className="grid grid-cols-2 gap-4">
            <EditableInput 
              label="Fully Compliant" 
              value={documentsData.onboardingFullyCompliant} 
              onChange={(value) => handleInputChange('onboardingFullyCompliant', value)} 
            />
            <EditableInput 
              label="Pending Documents" 
              value={documentsData.onboardingPendingDocuments} 
              onChange={(value) => handleInputChange('onboardingPendingDocuments', value)} 
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      {barData.length > 0 && (
        <Card className="p-4 bg-white">
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="category" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="compliant" fill="#22c55e" name="Fully Compliant" stackId="documents" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending Documents" stackId="documents" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Legend and Percentages */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Fully Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Pending Documents</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">Active Staff</div>
                <div className="text-muted-foreground">
                  {activeTotal > 0 ? `${Math.round((documentsData.activeFullyCompliant / activeTotal) * 100)}% Compliant` : 'No data'}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Onboarding Staff</div>
                <div className="text-muted-foreground">
                  {onboardingTotal > 0 ? `${Math.round((documentsData.onboardingFullyCompliant / onboardingTotal) * 100)}% Compliant` : 'No data'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};