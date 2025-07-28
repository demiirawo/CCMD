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
    const monthName = date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    });
    months.push({
      month: monthName,
      compliments: 0,
      complaints: 0,
      suggestions: 0,
      resolved: 0
    });
  }
  return months;
};
const chartConfig = {
  compliments: {
    label: "Compliments",
    color: "hsl(var(--chart-1))"
  },
  complaints: {
    label: "Complaints",
    color: "hsl(var(--chart-2))"
  },
  suggestions: {
    label: "Suggestions",
    color: "hsl(var(--chart-3))"
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-4))"
  }
};
interface FeedbackAnalyticsProps {
  meetingDate?: Date;
  sessionId?: string;
}

export const FeedbackAnalytics = ({
  meetingDate,
  sessionId
}: FeedbackAnalyticsProps) => {
  const { data: monthlyData, saveData } = useDashboardData(
    'feedback_analytics', 
    sessionId, 
    generateInitialData(meetingDate)
  );
  const handleCellEdit = (monthIndex: number, field: 'compliments' | 'complaints' | 'suggestions' | 'resolved', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = {
      ...newData[monthIndex],
      [field]: value
    };
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
        <h4 className="text-lg font-semibold text-foreground">Feedback Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly feedback tracking and resolution (Past 12 Months)</div>
      
      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {monthlyData.map((row, index) => <div key={index} className="p-3 border rounded-lg bg-white">
            <div className="text-sm font-medium mb-2">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Compliments:</div>
                <EditableCell value={row.compliments} onChange={value => handleCellEdit(index, 'compliments', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Complaints:</div>
                <EditableCell value={row.complaints} onChange={value => handleCellEdit(index, 'complaints', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Suggestions:</div>
                <EditableCell value={row.suggestions} onChange={value => handleCellEdit(index, 'suggestions', value)} />
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
              <Bar dataKey="compliments" fill="#22c55e" name="Compliments" stackId="feedback" />
              <Bar dataKey="complaints" fill="#ef4444" name="Complaints" stackId="feedback" />
              <Bar dataKey="suggestions" fill="#3b82f6" name="Suggestions" stackId="feedback" />
              <Line type="monotone" dataKey="resolved" stroke="#f59e0b" strokeWidth={2} dot={{
              r: 3,
              fill: "#f59e0b"
            }} name="Resolved" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Compliments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Complaints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Suggestions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-amber-500"></div>
            <span className="text-xs text-muted-foreground">Resolved</span>
          </div>
        </div>
      </Card>
    </div>;
};