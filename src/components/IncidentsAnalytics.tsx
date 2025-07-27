import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const generateInitialData = (meetingDate?: Date) => {
  const months = [];
  const now = meetingDate || new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    months.push({
      month: monthName,
      incidents: 0,
      accidents: 0,
      safeguarding: 0,
      resolved: 0,
      total: 0
    });
  }
  
  return months;
};

const chartConfig = {
  incidents: {
    label: "Incidents",
    color: "hsl(var(--chart-1))",
  },
  accidents: {
    label: "Accidents", 
    color: "hsl(var(--chart-2))",
  },
  safeguarding: {
    label: "Safeguarding",
    color: "hsl(var(--chart-3))",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-4))",
  },
};

interface EditableCellProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
}

const EditableCell = ({ value, onValueChange, className = "" }: EditableCellProps) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = () => {
    setEditing(true);
    setEditValue('');
  };

  const handleSave = () => {
    const numValue = parseInt(editValue) || 0;
    onValueChange(numValue);
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

interface IncidentsAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const IncidentsAnalytics = ({ meetingDate, meetingId }: IncidentsAnalyticsProps) => {
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
        .from('incidents_analytics')
        .select('monthly_data')
        .eq('meeting_id', meetingId)
        .eq('company_id', profile.company_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading incidents analytics:', error);
        return;
      }

      if (data?.monthly_data) {
        setMonthlyData(data.monthly_data as any[]);
      } else {
        setMonthlyData(generateInitialData(meetingDate));
      }
    } catch (error) {
      console.error('Error loading incidents analytics:', error);
      setMonthlyData(generateInitialData(meetingDate));
    }
  };

  const saveData = async (newData: any[]) => {
    if (!meetingId || !profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('incidents_analytics')
        .upsert({
          meeting_id: meetingId,
          company_id: profile.company_id,
          monthly_data: newData
        }, {
          onConflict: 'meeting_id,company_id'
        });

      if (error) {
        console.error('Error saving incidents analytics:', error);
      }
    } catch (error) {
      console.error('Error saving incidents analytics:', error);
    }
  };

  const handleCellEdit = (monthIndex: number, field: 'incidents' | 'accidents' | 'safeguarding' | 'resolved', value: number) => {
    setMonthlyData(prev => {
      const newData = [...prev];
      newData[monthIndex] = { 
        ...newData[monthIndex], 
        [field]: value,
        // Recalculate total when incidents, accidents, or safeguarding change
        total: field === 'resolved' 
          ? newData[monthIndex].total 
          : (field === 'incidents' ? value : newData[monthIndex].incidents) +
            (field === 'accidents' ? value : newData[monthIndex].accidents) +
            (field === 'safeguarding' ? value : newData[monthIndex].safeguarding)
      };
      saveData(newData);
      return newData;
    });
  };

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Incidents & Safeguarding Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly incident tracking and safeguarding monitoring across all service users (Past 12 Months)</div>
      
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium w-1/5">Month</th>
              <th className="text-left p-3 font-medium w-1/5">Incidents</th>
              <th className="text-left p-3 font-medium w-1/5">Accidents</th>
              <th className="text-left p-3 font-medium w-1/5">Safeguarding</th>
              <th className="text-left p-3 font-medium w-1/5">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row, index) => (
              <tr key={index} className="border-b border-border/30 hover:bg-accent/30">
                <td className="p-3">{row.month}</td>
                <td className="p-3">
                  <EditableCell value={row.incidents} onValueChange={(value) => handleCellEdit(index, 'incidents', value)} />
                </td>
                <td className="p-3">
                  <EditableCell value={row.accidents} onValueChange={(value) => handleCellEdit(index, 'accidents', value)} />
                </td>
                <td className="p-3">
                  <EditableCell value={row.safeguarding} onValueChange={(value) => handleCellEdit(index, 'safeguarding', value)} />
                </td>
                <td className="p-3">
                  <EditableCell value={row.resolved} onValueChange={(value) => handleCellEdit(index, 'resolved', value)} />
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
                  dataKey="incidents" 
                  stackId="cases"
                  fill="#3b82f6" 
                  name="Incidents"
                />
                <Bar 
                  dataKey="accidents" 
                  stackId="cases"
                  fill="#f59e0b" 
                  name="Accidents"
                />
                <Bar 
                  dataKey="safeguarding" 
                  stackId="cases"
                  fill="#8b5cf6" 
                  name="Safeguarding"
                />
                <Line 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: "#22c55e", strokeWidth: 1, r: 3 }}
                  name="Resolved"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-xs text-muted-foreground">Incidents</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-xs text-muted-foreground">Accidents</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-xs text-muted-foreground">Safeguarding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 border-b-2 border-green-500"></div>
              <span className="text-xs text-muted-foreground">Resolved</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};