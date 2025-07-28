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
      highSU: 0,
      mediumSU: 0,
      lowSU: 0,
      completed: 0
    });
  }
  
  return months;
};

const chartConfig = {
  completed: {
    label: "Completed Reviews",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Target Reviews", 
    color: "hsl(var(--chart-2))",
  },
};

interface CarePlanAnalyticsProps {
  meetingDate?: Date;
  sessionId?: string;
}

export const CarePlanAnalytics = ({ meetingDate, sessionId }: CarePlanAnalyticsProps) => {
  const { data: frequencies, saveData: saveFrequencies } = useDashboardData(
    'care_plan_frequencies',
    sessionId,
    { highFrequency: 6, mediumFrequency: 12, lowFrequency: 24 }
  );

  const { data: monthlyData, saveData } = useDashboardData(
    'care_plan_analytics', 
    sessionId, 
    generateInitialData(meetingDate)
  );

  const handleFrequencyChange = (field: string, value: number) => {
    const newFrequencies = { ...frequencies, [field]: value };
    saveFrequencies(newFrequencies);
  };

  const handleCellEdit = (monthIndex: number, field: 'highSU' | 'mediumSU' | 'lowSU' | 'completed', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = { ...newData[monthIndex], [field]: value };
    saveData(newData);
  };

  // Calculate targets based on service users and frequencies
  const dataWithTargets = monthlyData.map((month: any) => {
    const highTarget = Math.ceil(month.highSU / frequencies.highFrequency);
    const mediumTarget = Math.ceil(month.mediumSU / frequencies.mediumFrequency);
    const lowTarget = Math.ceil(month.lowSU / frequencies.lowFrequency);
    
    return {
      ...month,
      target: highTarget + mediumTarget + lowTarget
    };
  });

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
        <h4 className="text-lg font-semibold text-foreground">Care Plan Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly care plan review tracking with calculated targets (Past 12 Months)</div>
      
      {/* Frequency Settings */}
      <div className="flex flex-wrap gap-6 p-4 bg-accent/30 rounded-lg">
        <EditableInput 
          label="High Risk Frequency" 
          value={frequencies.highFrequency} 
          onChange={(value) => handleFrequencyChange('highFrequency', value)} 
        />
        <EditableInput 
          label="Medium Risk Frequency" 
          value={frequencies.mediumFrequency} 
          onChange={(value) => handleFrequencyChange('mediumFrequency', value)} 
        />
        <EditableInput 
          label="Low Risk Frequency" 
          value={frequencies.lowFrequency} 
          onChange={(value) => handleFrequencyChange('lowFrequency', value)} 
        />
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {monthlyData.map((row: any, index: number) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">High SU:</div>
                <EditableCell value={row.highSU} onChange={(value) => handleCellEdit(index, 'highSU', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Medium SU:</div>
                <EditableCell value={row.mediumSU} onChange={(value) => handleCellEdit(index, 'mediumSU', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Low SU:</div>
                <EditableCell value={row.lowSU} onChange={(value) => handleCellEdit(index, 'lowSU', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Completed:</div>
                <EditableCell value={row.completed} onChange={(value) => handleCellEdit(index, 'completed', value)} />
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
                name="Completed Reviews"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b" }}
                name="Target Reviews"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Completed Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-amber-500"></div>
            <span className="text-xs text-muted-foreground">Target Reviews</span>
          </div>
        </div>
      </Card>
    </div>
  );
};