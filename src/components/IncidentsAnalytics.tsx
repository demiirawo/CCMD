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
    const monthName = date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    });
    months.push({
      month: monthName,
      incidents: 0,
      accidents: 0,
      safeguarding: 0,
      resolved: 0
    });
  }
  return months;
};
const chartConfig = {
  incidents: {
    label: "Incidents",
    color: "hsl(var(--chart-1))"
  },
  accidents: {
    label: "Accidents",
    color: "hsl(var(--chart-2))"
  },
  safeguarding: {
    label: "Safeguarding",
    color: "hsl(var(--chart-3))"
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-4))"
  }
};
interface IncidentsAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}
export const IncidentsAnalytics = ({
  meetingDate,
  meetingId
}: IncidentsAnalyticsProps) => {
  const {
    profile
  } = useAuth();
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id]);
  useEffect(() => {
    // Always reload from database when meeting date changes to preserve all data
    if (profile?.company_id) {
      loadData();
    } else {
      setMonthlyData(generateInitialData(meetingDate));
    }
  }, [meetingDate, profile?.company_id]);
  const loadData = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        data,
        error
      } = await supabase.from('incidents_analytics').select('monthly_data').eq('company_id', profile.company_id).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading incidents analytics:', error);
        return;
      }
      if (data?.monthly_data) {
        const loadedData = data.monthly_data as any[];
        const currentStructure = generateInitialData(meetingDate);
        const mergedData = currentStructure.map(current => {
          const existing = loadedData.find(item => item.month === current.month);
          return existing || current;
        });
        setMonthlyData(mergedData);
      }
    } catch (error) {
      console.error('Error loading incidents analytics:', error);
    }
  };
  const saveData = async (newData: any[]) => {
    if (!profile?.company_id) return;
    try {
      const {
        error
      } = await supabase.from('incidents_analytics').upsert({
        company_id: profile.company_id,
        monthly_data: newData
      }, {
        onConflict: 'company_id'
      });
      if (error) {
        console.error('Error saving incidents analytics:', error);
      }
    } catch (error) {
      console.error('Error saving incidents analytics:', error);
    }
  };
  const handleCellEdit = (monthIndex: number, field: 'incidents' | 'accidents' | 'safeguarding' | 'resolved', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = {
      ...newData[monthIndex],
      [field]: value
    };
    setMonthlyData(newData);
    saveData(newData);
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
      }} className="w-16 h-8 text-sm" autoFocus />;
    }
    return <span className="cursor-pointer hover:bg-accent/50 p-1 rounded" onClick={handleStartEdit}>
        {value}
      </span>;
  };
  return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Incidents Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly incident tracking and resolution (Past 12 Months)</div>
      
      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {monthlyData.map((row, index) => <div key={index} className="p-3 border rounded-lg bg-white">
            <div className="text-sm font-medium mb-2">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Incidents:</div>
                <EditableCell value={row.incidents} onChange={value => handleCellEdit(index, 'incidents', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Accidents:</div>
                <EditableCell value={row.accidents} onChange={value => handleCellEdit(index, 'accidents', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Safeguarding:</div>
                <EditableCell value={row.safeguarding} onChange={value => handleCellEdit(index, 'safeguarding', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Resolved:</div>
                <EditableCell value={row.resolved} onChange={value => handleCellEdit(index, 'resolved', value)} />
              </div>
            </div>
          </div>)}
      </div>

      {/* Chart */}
      <Card className="p-4 bg-white">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData} margin={{
            top: 5,
            right: 5,
            bottom: 25,
            left: 5
          }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="incidents" fill="#ef4444" name="Incidents" stackId="incidents" />
              <Bar dataKey="accidents" fill="#f59e0b" name="Accidents" stackId="incidents" />
              <Bar dataKey="safeguarding" fill="#3b82f6" name="Safeguarding" stackId="incidents" />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{
              r: 3,
              fill: "#22c55e"
            }} name="Resolved" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Incidents</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Accidents</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Safeguarding</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-green-500"></div>
            <span className="text-xs text-muted-foreground">Resolved</span>
          </div>
        </div>
      </Card>
    </div>;
};