import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDashboardData } from "@/hooks/useDashboardData";

const generateInitialData = (meetingDate?: Date) => {
  const months = [];
  const currentDate = meetingDate || new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({
      month: monthName,
      onboardingStaff: 0,
      probationStaff: 0,
      currentStaff: 0,
      idealStaff: 0
    });
  }
  
  return months;
};

const chartConfig = {
  onboardingStaff: {
    label: "Onboarding Staff",
    color: "hsl(var(--chart-1))",
  },
  probationStaff: {
    label: "Probation Staff",
    color: "hsl(var(--chart-2))",
  },
  currentStaff: {
    label: "Current Staff",
    color: "hsl(var(--chart-3))",
  },
  idealStaff: {
    label: "Ideal Staff",
    color: "hsl(var(--chart-4))",
  },
};

interface CapacityAnalyticsProps {
  onMonthlyStaffDataChange?: (data: Array<{month: string, currentStaff: number, probationStaff?: number}>) => void;
  meetingDate?: Date;
  sessionId?: string;
}

export const CapacityAnalytics = ({ onMonthlyStaffDataChange, meetingDate, sessionId }: CapacityAnalyticsProps) => {
  const { data: monthlyData, saveData } = useDashboardData(
    'capacity_analytics', 
    sessionId, 
    generateInitialData(meetingDate)
  );

  const handleCellEdit = (monthIndex: number, field: 'onboardingStaff' | 'probationStaff' | 'currentStaff' | 'idealStaff', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = { ...newData[monthIndex], [field]: value };
    saveData(newData);

    // Notify parent component of monthly staff data changes
    if (onMonthlyStaffDataChange) {
      const staffData = newData.map((item: any) => ({
        month: item.month,
        currentStaff: item.currentStaff,
        probationStaff: item.probationStaff
      }));
      onMonthlyStaffDataChange(staffData);
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
      
      <div className="text-sm text-muted-foreground">Recruitment progress monitoring workforce pipeline against monthly staffing targets (Past 12 Months)</div>
      
      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {monthlyData.map((row: any, index: number) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Onboarding:</div>
                <EditableCell value={row.onboardingStaff} onChange={(value) => handleCellEdit(index, 'onboardingStaff', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Probation:</div>
                <EditableCell value={row.probationStaff} onChange={(value) => handleCellEdit(index, 'probationStaff', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Passed:</div>
                <EditableCell value={row.currentStaff} onChange={(value) => handleCellEdit(index, 'currentStaff', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Target:</div>
                <EditableCell value={row.idealStaff} onChange={(value) => handleCellEdit(index, 'idealStaff', value)} />
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
              <Bar dataKey="currentStaff" fill="#3b82f6" name="Passed" stackId="staff" />
              <Bar dataKey="probationStaff" fill="#f59e0b" name="Probation" stackId="staff" />
              <Bar dataKey="onboardingStaff" fill="#8b5cf6" name="Onboarding" stackId="staff" />
              <Line 
                type="monotone" 
                dataKey="idealStaff" 
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22c55e" }}
                name="Target"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Passed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Probation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Onboarding</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-green-500"></div>
            <span className="text-xs text-muted-foreground">Target</span>
          </div>
        </div>
      </Card>
    </div>
  );
};