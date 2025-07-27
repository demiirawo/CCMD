import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const generateInitialData = (meetingDate?: Date) => {
  const months = [];
  const currentDate = meetingDate || new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
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
    color: "hsl(var(--chart-1))",
  },
  complaints: {
    label: "Complaints", 
    color: "hsl(var(--chart-2))",
  },
  suggestions: {
    label: "Suggestions",
    color: "hsl(var(--chart-3))",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-4))",
  },
};

interface EditableCellProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onChange, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleSave = () => {
    const numValue = parseInt(tempValue) || 0;
    onChange(numValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTempValue(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-9 w-full text-center border-muted-foreground/20"
        autoFocus
        type="number"
        min="0"
      />
    );
  }

  return (
    <div 
      className="h-9 w-full flex items-center justify-center cursor-pointer hover:bg-accent/20 rounded border border-transparent hover:border-border transition-colors text-sm"
      onClick={() => setIsEditing(true)}
    >
      {value || placeholder || "0"}
    </div>
  );
};

interface FeedbackAnalyticsProps {
  meetingDate?: Date;
}

export const FeedbackAnalytics = ({ meetingDate }: FeedbackAnalyticsProps) => {
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));

  // Update data when meeting date changes
  useEffect(() => {
    setMonthlyData(generateInitialData(meetingDate));
  }, [meetingDate]);

  const handleCellEdit = (monthIndex: number, field: 'compliments' | 'complaints' | 'suggestions' | 'resolved', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = { ...newData[monthIndex], [field]: value };
    setMonthlyData(newData);
  };

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Feedback Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 bg-white">
        {/* Monthly Data Input Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Monthly Data</h4>
          <div className="bg-white rounded-lg p-4 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Metric
                  </th>
                  {monthlyData.map((data) => (
                    <th key={data.month} className="text-center py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[70px]">
                      {data.month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-1">
                <tr className="border-t border-border/50">
                  <td className="py-2 px-3 text-sm font-medium text-foreground">
                    Compliments
                  </td>
                  {monthlyData.map((data, index) => (
                    <td key={`compliments-${index}`} className="p-2">
                      <EditableCell
                        value={data.compliments}
                        onChange={(value) => handleCellEdit(index, 'compliments', value)}
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border/50">
                  <td className="py-2 px-3 text-sm font-medium text-foreground">
                    Complaints
                  </td>
                  {monthlyData.map((data, index) => (
                    <td key={`complaints-${index}`} className="p-2">
                      <EditableCell
                        value={data.complaints}
                        onChange={(value) => handleCellEdit(index, 'complaints', value)}
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border/50">
                  <td className="py-2 px-3 text-sm font-medium text-foreground">
                    Suggestions
                  </td>
                  {monthlyData.map((data, index) => (
                    <td key={`suggestions-${index}`} className="p-2">
                      <EditableCell
                        value={data.suggestions}
                        onChange={(value) => handleCellEdit(index, 'suggestions', value)}
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border/50">
                  <td className="py-2 px-3 text-sm font-medium text-foreground">
                    Resolved
                  </td>
                  {monthlyData.map((data, index) => (
                    <td key={`resolved-${index}`} className="p-2">
                      <EditableCell
                        value={data.resolved}
                        onChange={(value) => handleCellEdit(index, 'resolved', value)}
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Monthly Trends</h4>
          <div className="bg-muted/30 rounded-lg p-4">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={monthlyData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="compliments" 
                    stackId="feedback"
                    fill="var(--color-compliments)"
                    name="Compliments"
                    radius={[0, 0, 0, 0]}
                    opacity={0.8}
                  />
                  <Bar 
                    dataKey="complaints" 
                    stackId="feedback"
                    fill="var(--color-complaints)"
                    name="Complaints"
                    radius={[0, 0, 0, 0]}
                    opacity={0.8}
                  />
                  <Bar 
                    dataKey="suggestions" 
                    stackId="feedback"
                    fill="var(--color-suggestions)"
                    name="Suggestions"
                    radius={[3, 3, 0, 0]}
                    opacity={0.8}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="var(--color-resolved)"
                    strokeWidth={2}
                    dot={{ 
                      fill: "var(--color-resolved)", 
                      strokeWidth: 2, 
                      r: 4,
                      stroke: "hsl(var(--background))"
                    }}
                    activeDot={{ r: 6, stroke: "var(--color-resolved)", strokeWidth: 2 }}
                    name="Resolved"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};