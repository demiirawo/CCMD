import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
const generateInitialData = () => {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit'
    });
    months.push({
      month: monthStr,
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
    label: "Completed",
    color: "hsl(var(--chart-1))"
  },
  target: {
    label: "Target",
    color: "hsl(var(--chart-2))"
  }
};
export const CarePlanAnalytics = () => {
  const [monthlyData, setMonthlyData] = useState(generateInitialData());
  const [frequencies, setFrequencies] = useState({
    high: 6,
    medium: 12,
    low: 24
  });
  const dataWithTargets = monthlyData.map(month => {
    const highTarget = month.highSU / frequencies.high;
    const mediumTarget = month.mediumSU / frequencies.medium;
    const lowTarget = month.lowSU / frequencies.low;
    const totalTarget = Math.round(highTarget + mediumTarget + lowTarget);
    return {
      ...month,
      target: totalTarget
    };
  });
  const handleFrequencyChange = (category: keyof typeof frequencies, value: string) => {
    const numValue = parseInt(value) || 1;
    setFrequencies(prev => ({
      ...prev,
      [category]: numValue
    }));
  };
  const handleCellEdit = (monthIndex: number, field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setMonthlyData(prev => prev.map((month, index) => index === monthIndex ? {
      ...month,
      [field]: numValue
    } : month));
  };
  const EditableCell = ({
    value,
    onEdit
  }: {
    value: number;
    onEdit: (value: string) => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value.toString());
    useEffect(() => {
      setEditValue(value.toString());
    }, [value]);
    const handleSubmit = () => {
      onEdit(editValue);
      setIsEditing(false);
    };
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        setEditValue(value.toString());
        setIsEditing(false);
      }
    };
    if (isEditing) {
      return <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSubmit} onKeyDown={handleKeyPress} className="h-8 w-16 text-center" autoFocus />;
    }
    return <div onClick={() => setIsEditing(true)} className="h-8 w-16 flex items-center justify-center cursor-pointer hover:bg-muted rounded text-center">
        {value}
      </div>;
  };
  const EditableInput = ({
    label,
    value,
    onChange
  }: {
    label: string;
    value: number;
    onChange: (value: string) => void;
  }) => <div className="flex items-center gap-2">
      <Label className="text-sm font-medium whitespace-nowrap">{label}:</Label>
      <Input type="number" value={value} onChange={e => onChange(e.target.value)} className="w-20 h-8" min="1" />
      <span className="text-sm text-muted-foreground">months</span>
    </div>;
  return <Card className="w-full">
      <CardHeader className="bg-white">
        <CardTitle>Care Plan & Risk Assessment Analytics</CardTitle>
        <CardDescription>
          Monthly service user categories, completed reviews, and targets based on review frequencies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 bg-white">
        {/* Frequency Settings */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-white">
          <EditableInput label="High Frequency" value={frequencies.high} onChange={value => handleFrequencyChange('high', value)} />
          <EditableInput label="Medium Frequency" value={frequencies.medium} onChange={value => handleFrequencyChange('medium', value)} />
          <EditableInput label="Low Frequency" value={frequencies.low} onChange={value => handleFrequencyChange('low', value)} />
        </div>

        {/* Monthly Data Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Monthly Data</h3>
          <div className="grid grid-cols-5 gap-2 text-sm font-medium p-2 bg-muted/30 rounded">
            <div>Month</div>
            <div className="text-center">High SU</div>
            <div className="text-center">Medium SU</div>
            <div className="text-center">Low SU</div>
            <div className="text-center">Completed</div>
          </div>
          
          {monthlyData.map((month, index) => <div key={month.month} className="grid grid-cols-5 gap-2 items-center p-2 hover:bg-muted/20 rounded">
              <div className="font-medium">{month.month}</div>
              <div className="flex justify-center">
                <EditableCell value={month.highSU} onEdit={value => handleCellEdit(index, 'highSU', value)} />
              </div>
              <div className="flex justify-center">
                <EditableCell value={month.mediumSU} onEdit={value => handleCellEdit(index, 'mediumSU', value)} />
              </div>
              <div className="flex justify-center">
                <EditableCell value={month.lowSU} onEdit={value => handleCellEdit(index, 'lowSU', value)} />
              </div>
              <div className="flex justify-center">
                <EditableCell value={month.completed} onEdit={value => handleCellEdit(index, 'completed', value)} />
              </div>
            </div>)}
        </div>

        {/* Chart */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Care Plan Reviews: Target vs Completed</h3>
          <ChartContainer config={chartConfig} className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dataWithTargets} margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="completed" fill="var(--color-completed)" name="Completed Reviews" />
                <Line type="monotone" dataKey="target" stroke="var(--color-target)" strokeWidth={3} dot={{
                r: 4
              }} name="Target Reviews" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-chart-1 rounded"></div>
              <span>Completed Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-chart-2 rounded"></div>
              <span>Target Reviews</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};