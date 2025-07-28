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
      onboarding: 0,
      probation: 0,
      passed: 0,
      target: 0
    });
  }
  
  return months;
};

const chartConfig = {
  onboarding: {
    label: "Onboarding",
    color: "hsl(var(--chart-1))",
  },
  probation: {
    label: "Probation",
    color: "hsl(var(--chart-2))",
  },
  passed: {
    label: "Passed",
    color: "hsl(var(--chart-3))",
  },
  target: {
    label: "Target",
    color: "hsl(var(--chart-4))",
  },
};

interface CapacityAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
  onMonthlyStaffDataChange?: (data: any) => void;
}

export const CapacityAnalytics = ({ meetingDate, meetingId, onMonthlyStaffDataChange }: CapacityAnalyticsProps) => {
  const { profile } = useAuth();
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));

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
      // For now, use the individual records approach until migration is approved
      const { data, error } = await supabase
        .from('resourcing_analytics')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('month');

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading resourcing analytics:', error);
        return;
      }

      if (data && data.length > 0) {
        const currentStructure = generateInitialData(meetingDate);
        
        const mergedData = currentStructure.map(current => {
          const existing = data.find(item => item.month === current.month);
          if (existing) {
            return {
              month: current.month,
              onboarding: existing.onboarding_staff || 0,
              probation: existing.probation_staff || 0,
              passed: existing.current_staff || 0,
              target: existing.ideal_staff || 0
            };
          }
          return current;
        });
        
        setMonthlyData(mergedData);
      }
    } catch (error) {
      console.error('Error loading resourcing analytics:', error);
    }
  };

  const saveData = async (newData: any[]) => {
    if (!profile?.company_id) return;

    try {
      // Save each month as a separate record
      for (const monthData of newData) {
        const { error } = await supabase
          .from('resourcing_analytics')
          .upsert({
            company_id: profile.company_id,
            month: monthData.month,
            onboarding_staff: monthData.onboarding,
            probation_staff: monthData.probation,
            current_staff: monthData.passed,
            ideal_staff: monthData.target
          }, {
            onConflict: 'company_id,month'
          });

        if (error) {
          console.error('Error saving resourcing analytics:', error);
        }
      }
    } catch (error) {
      console.error('Error saving resourcing analytics:', error);
    }
  };

  const handleCellEdit = (monthIndex: number, field: 'onboarding' | 'probation' | 'passed' | 'target', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = { ...newData[monthIndex], [field]: value };
    setMonthlyData(newData);
    saveData(newData);
    
    if (onMonthlyStaffDataChange) {
      onMonthlyStaffDataChange(newData);
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
        <h4 className="text-lg font-semibold text-foreground">Resourcing Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Recruitment progress, monitoring workforce pipeline against monthly staffing targets (Past 12 Months)</div>
      
      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {monthlyData.map((row, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Onboarding:</div>
                <EditableCell value={row.onboarding} onChange={(value) => handleCellEdit(index, 'onboarding', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Probation:</div>
                <EditableCell value={row.probation} onChange={(value) => handleCellEdit(index, 'probation', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Passed:</div>
                <EditableCell value={row.passed} onChange={(value) => handleCellEdit(index, 'passed', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Target:</div>
                <EditableCell value={row.target} onChange={(value) => handleCellEdit(index, 'target', value)} />
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
                dataKey="onboarding" 
                fill="#3b82f6"
                name="Onboarding"
              />
              <Bar 
                dataKey="probation" 
                fill="#f59e0b"
                name="Probation"
              />
              <Bar 
                dataKey="passed" 
                fill="#10b981"
                name="Passed"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3, fill: "#ef4444" }}
                name="Target"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Onboarding</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Probation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Passed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-red-500"></div>
            <span className="text-xs text-muted-foreground">Target</span>
          </div>
        </div>
      </Card>
    </div>
  );
};