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

interface EditableCellProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onChange, placeholder }) => {
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

interface MedicationAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const MedicationAnalytics = ({ meetingDate, meetingId }: MedicationAnalyticsProps) => {
  const { profile } = useAuth();
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));

  // Load data from Supabase when component mounts or meetingId changes
  useEffect(() => {
    if (meetingId && profile?.company_id) {
      loadData();
    } else {
      setMonthlyData(generateInitialData(meetingDate));
    }
  }, [meetingId, profile?.company_id, meetingDate]);

  const loadData = async () => {
    if (!meetingId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('medication_analytics')
        .select('monthly_data')
        .eq('meeting_id', meetingId)
        .eq('company_id', profile.company_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading medication analytics:', error);
        return;
      }

      if (data?.monthly_data) {
        setMonthlyData(data.monthly_data as any[]);
      } else {
        setMonthlyData(generateInitialData(meetingDate));
      }
    } catch (error) {
      console.error('Error loading medication analytics:', error);
      setMonthlyData(generateInitialData(meetingDate));
    }
  };

  const saveData = async (newData: any[]) => {
    if (!meetingId || !profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('medication_analytics')
        .upsert({
          meeting_id: meetingId,
          company_id: profile.company_id,
          monthly_data: newData
        }, {
          onConflict: 'meeting_id,company_id'
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

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Medication Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly medication records and error tracking across all service users (Past 12 Months)</div>
      
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium w-1/3">Month</th>
              <th className="text-left p-3 font-medium w-1/3">Medication Records</th>
              <th className="text-left p-3 font-medium w-1/3">Incorrect Outcomes</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row, index) => (
              <tr key={index} className="border-b border-border/30 hover:bg-accent/30">
                <td className="p-3">{row.month}</td>
                <td className="p-3">
                  <EditableCell value={row.medicationRecords} onChange={(value) => handleCellEdit(index, 'medicationRecords', value)} />
                </td>
                <td className="p-3">
                  <EditableCell value={row.incorrectOutcomes} onChange={(value) => handleCellEdit(index, 'incorrectOutcomes', value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div className="space-y-2">
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
    </div>
  );
};