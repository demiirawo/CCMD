import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const generateInitialData = () => {
  const months = [];
  const currentDate = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({
      month: monthName,
      medicationRecords: 0,
      incorrectOutcomes: 0
    });
  }
  
  return months;
};

const chartConfig = {
  medicationRecords: {
    label: "Medication Records",
    color: "hsl(var(--chart-1))",
  },
  incorrectOutcomes: {
    label: "Incorrect Outcomes",
    color: "hsl(var(--chart-2))",
  },
};

interface EditableCellProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onChange, label }) => {
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
        className="h-8 w-16 text-center"
        autoFocus
      />
    );
  }

  return (
    <div 
      className="h-8 w-16 flex items-center justify-center cursor-pointer hover:bg-accent/20 rounded border border-transparent hover:border-border"
      onClick={() => setIsEditing(true)}
      title={`Click to edit ${label}`}
    >
      {value}
    </div>
  );
};

export const MedicationAnalytics = () => {
  const [monthlyData, setMonthlyData] = useState(generateInitialData());

  const handleCellEdit = (monthIndex: number, field: 'medicationRecords' | 'incorrectOutcomes', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = { ...newData[monthIndex], [field]: value };
    setMonthlyData(newData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Medication Management Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Input Grid */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Monthly Data (Click values to edit)</h4>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-13 gap-2 min-w-fit">
              {/* Headers */}
              <div className="font-medium text-xs"></div>
              {monthlyData.map((data) => (
                <div key={data.month} className="font-medium text-xs text-center min-w-[60px]">
                  {data.month}
                </div>
              ))}
              
              {/* Medication Records Row */}
              <div className="font-medium text-xs py-2">Medication Records</div>
              {monthlyData.map((data, index) => (
                <div key={`records-${index}`} className="flex justify-center">
                  <EditableCell
                    value={data.medicationRecords}
                    onChange={(value) => handleCellEdit(index, 'medicationRecords', value)}
                    label={`Medication Records for ${data.month}`}
                  />
                </div>
              ))}
              
              {/* Incorrect Outcomes Row */}
              <div className="font-medium text-xs py-2">Incorrect Outcomes</div>
              {monthlyData.map((data, index) => (
                <div key={`outcomes-${index}`} className="flex justify-center">
                  <EditableCell
                    value={data.incorrectOutcomes}
                    onChange={(value) => handleCellEdit(index, 'incorrectOutcomes', value)}
                    label={`Incorrect Outcomes for ${data.month}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Monthly Trends</h4>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="medicationRecords" 
                  fill="var(--color-medicationRecords)"
                  name="Medication Records"
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="incorrectOutcomes" 
                  stroke="var(--color-incorrectOutcomes)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-incorrectOutcomes)", strokeWidth: 2, r: 4 }}
                  name="Incorrect Outcomes"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};