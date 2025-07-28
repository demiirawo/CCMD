import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const generateInitialData = (meetingDate?: Date) => {
  const months = [];
  const currentDate = meetingDate || new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({
      month: monthName,
      medicationRecords: 0,
      incorrectOutcomes: 0
    });
  }
  
  return months;
};

const chartConfig = {
  medicationRecords: {
    label: "Medication Records",
    color: "hsl(var(--chart-1))",
  },
  incorrectOutcomes: {
    label: "Incorrect Outcomes", 
    color: "hsl(var(--chart-2))",
  },
};

interface MedicationAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const MedicationAnalytics = ({ meetingDate, meetingId }: MedicationAnalyticsProps) => {
  const { profile } = useAuth();
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));

  // Load data from company (not per meeting) to ensure persistence
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id]);

  // Always reload from database when meeting date changes to preserve all data
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    } else {
      setMonthlyData(generateInitialData(meetingDate));
    }
  }, [meetingDate, profile?.company_id]);

  const loadData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('medication_analytics')
        .select('monthly_data')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading medication analytics:', error);
        return;
      }

      if (data?.monthly_data) {
        const loadedData = data.monthly_data as any[];
        const currentStructure = generateInitialData(meetingDate);
        
        // Merge loaded data with current structure
        const mergedData = currentStructure.map(current => {
          const existing = loadedData.find(item => item.month === current.month);
          return existing || current;
        });
        
        setMonthlyData(mergedData);
      }
    } catch (error) {
      console.error('Error loading medication analytics:', error);
    }
  };

  const saveData = async (newData: any[]) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('medication_analytics')
        .upsert({
          company_id: profile.company_id,
          monthly_data: newData
        }, {
          onConflict: 'company_id'
        });

      if (error) {
        console.error('Error saving medication analytics:', error);
      }
    } catch (error) {
      console.error('Error saving medication analytics:', error);
    }
  };

  const handleCellEdit = (monthIndex: number, field: 'medicationRecords' | 'incorrectOutcomes', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = { ...newData[monthIndex], [field]: value };
    setMonthlyData(newData);
    saveData(newData);
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
          onChange={e => setEditValue(e.target.value)} 
          onBlur={handleSave} 
          onKeyDown={e => {
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

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Medication Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly medication records and error tracking (Past 12 Months)</div>
      
      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {monthlyData.map((row, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Records:</div>
                <EditableCell value={row.medicationRecords} onChange={(value) => handleCellEdit(index, 'medicationRecords', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Errors:</div>
                <EditableCell value={row.incorrectOutcomes} onChange={(value) => handleCellEdit(index, 'incorrectOutcomes', value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-4 bg-white">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={monthlyData} 
              margin={{ top: 5, right: 5, bottom: 25, left: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="medicationRecords" 
                fill="#3b82f6"
                name="Medication Records"
              />
              <Line 
                type="monotone" 
                dataKey="incorrectOutcomes" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b" }}
                name="Incorrect Outcomes"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Medication Records</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-amber-500"></div>
            <span className="text-xs text-muted-foreground">Incorrect Outcomes</span>
          </div>
        </div>
      </Card>
    </div>
  );
};