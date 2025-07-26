import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format, subMonths } from "date-fns";

// Generate 12 months of data from current month back to same month last year
const generateInitialData = () => {
  const currentDate = new Date();
  const data = [];
  for (let i = 0; i < 12; i++) {
    const monthDate = subMonths(currentDate, i);
    data.unshift({
      month: format(monthDate, "MMM"),
      completed: 0
    });
  }
  return data;
};

const initialMonthlyData = generateInitialData();

const chartConfig = {
  completed: {
    label: "Spot Checks Completed",
    color: "hsl(var(--chart-1))"
  }
};

export const SpotCheckAnalytics = () => {
  const [monthlyData, setMonthlyData] = useState(initialMonthlyData);
  const [metrics, setMetrics] = useState({
    activeStaff: 25,
    frequency: 3
  });

  // Calculate monthly target automatically
  const monthlyTarget = Math.round(metrics.activeStaff / metrics.frequency);

  const handleMetricChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setMetrics(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleCellEdit = (rowIndex: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newData = [...monthlyData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      completed: numValue
    };
    setMonthlyData(newData);
  };

  const EditableCell = ({
    value,
    onEdit
  }: {
    value: number;
    onEdit: (val: string) => void;
  }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(value.toString());

    const handleSave = () => {
      onEdit(editValue);
      setEditing(false);
    };

    if (editing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-full h-auto text-center border-none bg-white p-1 text-sm focus:ring-0 focus:outline-none"
          autoFocus
        />
      );
    }

    return (
      <span
        className="cursor-pointer hover:bg-accent/50 p-1 rounded"
        onClick={() => setEditing(true)}
      >
        {value}
      </span>
    );
  };

  const EditableInput = ({
    label,
    value,
    onChange,
    className = ""
  }: {
    label: string;
    value: number;
    onChange: (value: string) => void;
    className?: string;
  }) => (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-center"
      />
    </div>
  );

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Spot Check Analytics</h4>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <EditableInput
          label="Active Staff"
          value={metrics.activeStaff}
          onChange={(val) => handleMetricChange('activeStaff', val)}
        />
        <EditableInput
          label="Frequency (months)"
          value={metrics.frequency}
          onChange={(val) => handleMetricChange('frequency', val)}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Monthly Target</label>
          <div className="text-center p-2 text-lg font-semibold text-purple-600">
            {monthlyTarget}
          </div>
        </div>
      </div>

      {/* Monthly Data Section */}
      <div>
        <h5 className="text-base font-medium text-foreground mb-4">
          Monthly Spot Checks Completed (Last 12 Months)
        </h5>

        {/* Data Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {monthlyData.map((row, index) => (
            <div key={index} className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">{row.month}</div>
              <div className="border rounded p-2 text-center">
                <EditableCell
                  value={row.completed}
                  onEdit={(val) => handleCellEdit(index, val)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <Card className="p-4 bg-white">
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-xs" 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-xs" 
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine 
                  y={monthlyTarget}
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      </div>
    </div>
  );
};