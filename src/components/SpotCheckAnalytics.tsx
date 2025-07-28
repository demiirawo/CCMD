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
      completed: 0
    });
  }
  
  return months;
};

const chartConfig = {
  completed: {
    label: "Completed Spot Checks",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Monthly Target", 
    color: "hsl(var(--chart-2))",
  },
};

interface SpotCheckAnalyticsProps {
  monthlyStaffData?: Array<{month: string, currentStaff: number, probationStaff?: number}>;
  meetingDate?: Date;
  meetingId?: string;
}

export const SpotCheckAnalytics = ({ monthlyStaffData = [], meetingDate, meetingId }: SpotCheckAnalyticsProps) => {
  const { profile } = useAuth();
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));
  const [metrics, setMetrics] = useState({
    passedFrequency: 3,
    probationFrequency: 1
  });

  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id]);

  useEffect(() => {
    const newMonthStructure = generateInitialData(meetingDate);
    
    if (monthlyData.length > 0) {
      const preservedData = newMonthStructure.map(newMonth => {
        const existingMonth = monthlyData.find(existing => existing.month === newMonth.month);
        return existingMonth || newMonth;
      });
      setMonthlyData(preservedData);
    } else {
      setMonthlyData(newMonthStructure);
    }
  }, [meetingDate]);

  const loadData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('spot_check_analytics')
        .select('*')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading spot check data:', error);
        return;
      }

      if (data) {
        setMetrics({
          passedFrequency: data.passed_frequency,
          probationFrequency: data.probation_frequency
        });
        
        if (data.monthly_data) {
          const loadedData = data.monthly_data as any[];
          const currentStructure = generateInitialData(meetingDate);
          
          const mergedData = currentStructure.map(current => {
            const existing = loadedData.find(item => item.month === current.month);
            return existing || current;
          });
          
          setMonthlyData(mergedData);
        }
      }
    } catch (error) {
      console.error('Error in loadData:', error);
    }
  };

  const saveData = async (newMetrics?: typeof metrics, newMonthlyData?: typeof monthlyData) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('spot_check_analytics')
        .upsert({
          company_id: profile.company_id,
          passed_frequency: newMetrics?.passedFrequency ?? metrics.passedFrequency,
          probation_frequency: newMetrics?.probationFrequency ?? metrics.probationFrequency,
          monthly_data: newMonthlyData || monthlyData
        }, {
          onConflict: 'company_id'
        });

      if (error) {
        console.error('Error saving spot check data:', error);
      }
    } catch (error) {
      console.error('Error in saveData:', error);
    }
  };

  // Calculate targets based on monthly staff data and frequencies
  const dataWithTargets = monthlyData.map((month) => {
    const staffMonth = monthlyStaffData.find(staff => staff.month === month.month);
    const currentStaff = staffMonth?.currentStaff || 0;
    const probationStaff = staffMonth?.probationStaff || 0;
    
    const passedStaff = Math.max(0, currentStaff - probationStaff);
    const passedTarget = Math.ceil(passedStaff / metrics.passedFrequency);
    const probationTarget = probationStaff * metrics.probationFrequency;
    
    return {
      ...month,
      target: passedTarget + probationTarget
    };
  });

  const handleMetricChange = (field: 'passedFrequency' | 'probationFrequency', value: number) => {
    const newMetrics = { ...metrics, [field]: value };
    setMetrics(newMetrics);
    saveData(newMetrics);
  };

  const handleCellEdit = (monthIndex: number, value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = { ...newData[monthIndex], completed: value };
    setMonthlyData(newData);
    saveData(undefined, newData);
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

  const EditableInput = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const handleStartEdit = () => {
      setEditing(true);
      setEditValue(value.toString());
    };

    const handleSave = () => {
      const numValue = parseInt(editValue) || 1;
      onChange(Math.max(1, numValue));
      setEditing(false);
    };

    return (
      <div className="flex items-center gap-2">
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
          <span className="cursor-pointer hover:bg-accent/50 p-1 rounded text-sm" onClick={handleStartEdit}>
            {value} {value === 1 ? 'month' : 'months'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Spot Check Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly spot check completion tracking (Past 12 Months)</div>
      
      {/* Frequency Settings */}
      <div className="flex flex-wrap gap-6 p-4 bg-accent/30 rounded-lg">
        <EditableInput 
          label="Passed Staff Frequency" 
          value={metrics.passedFrequency} 
          onChange={(value) => handleMetricChange('passedFrequency', value)} 
        />
        <EditableInput 
          label="Probation Staff Frequency" 
          value={metrics.probationFrequency} 
          onChange={(value) => handleMetricChange('probationFrequency', value)} 
        />
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {monthlyData.map((row, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">{row.month}</div>
            <div className="text-xs text-muted-foreground mb-1">Completed:</div>
            <EditableCell value={row.completed} onChange={(value) => handleCellEdit(index, value)} />
          </div>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-4 bg-white">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={dataWithTargets} 
              margin={{ top: 5, right: 5, bottom: 25, left: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="completed" 
                fill="#3b82f6"
                name="Completed Spot Checks"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b" }}
                name="Monthly Target"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Completed Spot Checks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-amber-500"></div>
            <span className="text-xs text-muted-foreground">Monthly Target</span>
          </div>
        </div>
      </Card>
    </div>
  );
};