import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const generateInitialData = () => {
  const months = [];
  const currentDate = new Date();
  
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

export const CareNotesAnalytics = () => {
  const [monthlyData, setMonthlyData] = useState(generateInitialData());

  const handleCellEdit = (monthIndex: number, field: 'totalRecordedCareNotes' | 'nonCompliantCareNotes', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = { ...newData[monthIndex], [field]: value };
    setMonthlyData(newData);
  };

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Care Notes Analytics</CardTitle>
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
                    Total Recorded Care Notes
                  </td>
                  {monthlyData.map((data, index) => (
                    <td key={`total-${index}`} className="p-2">
                      <EditableCell
                        value={data.totalRecordedCareNotes}
                        onChange={(value) => handleCellEdit(index, 'totalRecordedCareNotes', value)}
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border/50">
                  <td className="py-2 px-3 text-sm font-medium text-foreground">
                    Non Compliant Care Notes
                  </td>
                  {monthlyData.map((data, index) => (
                    <td key={`noncompliant-${index}`} className="p-2">
                      <EditableCell
                        value={data.nonCompliantCareNotes}
                        onChange={(value) => handleCellEdit(index, 'nonCompliantCareNotes', value)}
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
                    dataKey="totalRecordedCareNotes" 
                    fill="var(--color-totalRecordedCareNotes)"
                    name="Total Recorded Care Notes"
                    radius={[3, 3, 0, 0]}
                    opacity={0.8}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="nonCompliantCareNotes" 
                    stroke="var(--color-nonCompliantCareNotes)"
                    strokeWidth={2}
                    dot={{ 
                      fill: "var(--color-nonCompliantCareNotes)", 
                      strokeWidth: 2, 
                      r: 4,
                      stroke: "hsl(var(--background))"
                    }}
                    activeDot={{ r: 6, stroke: "var(--color-nonCompliantCareNotes)", strokeWidth: 2 }}
                    name="Non Compliant Care Notes"
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