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
      totalRecordedCareNotes: 0,
      nonCompliantCareNotes: 0
    });
  }
  
  return months;
};

const chartConfig = {
  totalRecordedCareNotes: {
    label: "Total Recorded Care Notes",
    color: "hsl(var(--chart-1))",
  },
  nonCompliantCareNotes: {
    label: "Non Compliant Care Notes", 
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

interface CareNotesAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const CareNotesAnalytics = ({ meetingDate, meetingId }: CareNotesAnalyticsProps) => {
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
        .from('care_notes_analytics')
        .select('monthly_data')
        .eq('meeting_id', meetingId)
        .eq('company_id', profile.company_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading care notes analytics:', error);
        return;
      }

      if (data?.monthly_data) {
        setMonthlyData(data.monthly_data as any[]);
      } else {
        setMonthlyData(generateInitialData(meetingDate));
      }
    } catch (error) {
      console.error('Error loading care notes analytics:', error);
      setMonthlyData(generateInitialData(meetingDate));
    }
  };

  const saveData = async (newData: any[]) => {
    if (!meetingId || !profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('care_notes_analytics')
        .upsert({
          meeting_id: meetingId,
          company_id: profile.company_id,
          monthly_data: newData
        }, {
          onConflict: 'meeting_id,company_id'
        });

      if (error) {
        console.error('Error saving care notes analytics:', error);
      }
    } catch (error) {
      console.error('Error saving care notes analytics:', error);
    }
  };

  const handleCellEdit = (monthIndex: number, field: 'totalRecordedCareNotes' | 'nonCompliantCareNotes', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = { ...newData[monthIndex], [field]: value };
    setMonthlyData(newData);
    saveData(newData);
  };

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Care Notes Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly care notes tracking and compliance monitoring across all service users (Past 12 Months)</div>
      
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium w-1/3">Month</th>
              <th className="text-left p-3 font-medium w-1/3">Total Recorded Care Notes</th>
              <th className="text-left p-3 font-medium w-1/3">Non Compliant Care Notes</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row, index) => (
              <tr key={index} className="border-b border-border/30 hover:bg-accent/30">
                <td className="p-3">{row.month}</td>
                <td className="p-3">
                  <EditableCell value={row.totalRecordedCareNotes} onChange={(value) => handleCellEdit(index, 'totalRecordedCareNotes', value)} />
                </td>
                <td className="p-3">
                  <EditableCell value={row.nonCompliantCareNotes} onChange={(value) => handleCellEdit(index, 'nonCompliantCareNotes', value)} />
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
                  dataKey="totalRecordedCareNotes" 
                  fill="#3b82f6"
                  name="Total Recorded Care Notes"
                />
                <Line 
                  type="monotone" 
                  dataKey="nonCompliantCareNotes" 
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#f59e0b" }}
                  name="Non Compliant Care Notes"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-xs text-muted-foreground">Total Recorded Care Notes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 border-b-2 border-amber-500"></div>
              <span className="text-xs text-muted-foreground">Non Compliant Care Notes</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};