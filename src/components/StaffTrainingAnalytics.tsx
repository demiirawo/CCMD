import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const chartConfig = {
  compliant: {
    label: "Compliant",
    color: "hsl(var(--chart-1))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-2))",
  },
};

interface StaffTrainingAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const StaffTrainingAnalytics = ({ meetingDate, meetingId }: StaffTrainingAnalyticsProps) => {
  const { profile } = useAuth();
  const [trainingData, setTrainingData] = useState({
    mandatoryCompliant: 0,
    mandatoryPending: 0,
    specialistCompliant: 0,
    specialistPending: 0
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
        .from('staff_training_analytics')
        .select('*')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading staff training analytics:', error);
        return;
      }

      if (data) {
        setTrainingData({
          mandatoryCompliant: data.mandatory_compliant,
          mandatoryPending: data.mandatory_pending,
          specialistCompliant: data.specialist_compliant,
          specialistPending: data.specialist_pending
        });
      }
    } catch (error) {
      console.error('Error loading staff training analytics:', error);
    }
  };

  const saveData = async (newData: typeof trainingData) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('staff_training_analytics')
        .upsert({
          company_id: profile.company_id,
          mandatory_compliant: newData.mandatoryCompliant,
          mandatory_pending: newData.mandatoryPending,
          specialist_compliant: newData.specialistCompliant,
          specialist_pending: newData.specialistPending
        }, {
          onConflict: 'company_id'
        });

      if (error) {
        console.error('Error saving staff training analytics:', error);
      }
    } catch (error) {
      console.error('Error saving staff training analytics:', error);
    }
  };

  const handleInputChange = (field: keyof typeof trainingData, value: number) => {
    const newData = { ...trainingData, [field]: value };
    setTrainingData(newData);
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

  const mandatoryTotal = trainingData.mandatoryCompliant + trainingData.mandatoryPending;
  const specialistTotal = trainingData.specialistCompliant + trainingData.specialistPending;
  
  const barData = [
    {
      category: "Mandatory Training",
      compliant: trainingData.mandatoryCompliant,
      pending: trainingData.mandatoryPending,
    },
    {
      category: "Specialist Training", 
      compliant: trainingData.specialistCompliant,
      pending: trainingData.specialistPending,
    },
  ].filter(item => item.compliant > 0 || item.pending > 0);

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Staff Training Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Staff training compliance overview</div>
      
      {/* Input Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4 p-4 border rounded-lg">
          <h5 className="font-medium">Mandatory Training</h5>
          <div className="grid grid-cols-2 gap-4">
            <EditableInput 
              label="Compliant" 
              value={trainingData.mandatoryCompliant} 
              onChange={(value) => handleInputChange('mandatoryCompliant', value)} 
            />
            <EditableInput 
              label="Pending" 
              value={trainingData.mandatoryPending} 
              onChange={(value) => handleInputChange('mandatoryPending', value)} 
            />
          </div>
        </div>
        
        <div className="space-y-4 p-4 border rounded-lg">
          <h5 className="font-medium">Specialist Training</h5>
          <div className="grid grid-cols-2 gap-4">
            <EditableInput 
              label="Compliant" 
              value={trainingData.specialistCompliant} 
              onChange={(value) => handleInputChange('specialistCompliant', value)} 
            />
            <EditableInput 
              label="Pending" 
              value={trainingData.specialistPending} 
              onChange={(value) => handleInputChange('specialistPending', value)} 
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
                <Bar dataKey="compliant" fill="#22c55e" name="Compliant" stackId="training" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" stackId="training" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Legend and Percentages */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">Mandatory Training</div>
                <div className="text-muted-foreground">
                  {mandatoryTotal > 0 ? `${Math.round((trainingData.mandatoryCompliant / mandatoryTotal) * 100)}% Compliant` : 'No data'}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Specialist Training</div>
                <div className="text-muted-foreground">
                  {specialistTotal > 0 ? `${Math.round((trainingData.specialistCompliant / specialistTotal) * 100)}% Compliant` : 'No data'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};