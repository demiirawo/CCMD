import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMonths } from "date-fns";
// Generate 12 months of data from current month back to same month last year
const generateInitialData = () => {
  const currentDate = new Date();
  const data = [];
  for (let i = 0; i < 12; i++) {
    const monthDate = subMonths(currentDate, i);
    data.unshift({
      month: format(monthDate, "MMM yy"),
      onboardingStaff: 0,
      probationStaff: 0,
      currentStaff: 0,
      idealStaff: 0
    });
  }
  return data;
};
const initialMonthlyData = generateInitialData();
const initialCurrentMetrics = {
  activeOnboardingStaff: 0,
  currentStaffingLevel: 0,
  minimumStaffingLevel: 0,
  idealStaffingLevel: 0,
  capacityCoverage: 0
};
const chartConfig = {
  onboardingStaff: {
    label: "Onboarding Staff",
    color: "hsl(var(--chart-1))"
  },
  probationStaff: {
    label: "Probation Staff",
    color: "hsl(var(--chart-2))"
  },
  currentStaff: {
    label: "Current Staff",
    color: "hsl(var(--chart-3))"
  },
  idealStaff: {
    label: "Ideal Staff",
    color: "hsl(var(--chart-4))"
  }
};
export const CapacityAnalytics = ({ onMonthlyStaffDataChange }: { onMonthlyStaffDataChange?: (data: Array<{month: string, currentStaff: number, probationStaff?: number}>) => void } = {}) => {
  const [monthlyData, setMonthlyData] = useState(initialMonthlyData);
  const [currentMetrics, setCurrentMetrics] = useState(initialCurrentMetrics);
  
  // Send initial monthly staff data to parent component
  useEffect(() => {
    if (onMonthlyStaffDataChange) {
      const staffData = monthlyData.map(item => ({
        month: item.month,
        currentStaff: item.currentStaff,
        probationStaff: item.probationStaff
      }));
      onMonthlyStaffDataChange(staffData);
    }
  }, [onMonthlyStaffDataChange]);
  const handleCellEdit = (rowIndex: number, field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const newData = [...monthlyData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [field]: numValue
    };
    setMonthlyData(newData);

    // Update current metrics based on latest data
    const latestRow = newData[newData.length - 1];
    const totalStaff = latestRow.onboardingStaff + latestRow.probationStaff + latestRow.currentStaff;
    const coverage = latestRow.idealStaff > 0 ? totalStaff / latestRow.idealStaff * 100 : 0;
    setCurrentMetrics({
      activeOnboardingStaff: latestRow.onboardingStaff,
      currentStaffingLevel: totalStaff,
      minimumStaffingLevel: 0,
      idealStaffingLevel: latestRow.idealStaff,
      capacityCoverage: Math.round(coverage * 10) / 10
    });

    // Notify parent component of monthly staff data changes
    if (onMonthlyStaffDataChange) {
      const staffData = newData.map(item => ({
        month: item.month,
        currentStaff: item.currentStaff,
        probationStaff: item.probationStaff
      }));
      onMonthlyStaffDataChange(staffData);
    }
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
      return <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={e => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setEditing(false);
      }} className="w-16 h-8 text-sm" autoFocus />;
    }
    return <span className="cursor-pointer hover:bg-accent/50 p-1 rounded" onClick={() => setEditing(true)}>
        {value}
      </span>;
  };
  return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Capacity Analytics</h4>
        
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly Data (Past 12 Months)</div>
      
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium w-1/5">Month</th>
              <th className="text-left p-3 font-medium w-1/5">Onboarding</th>
              <th className="text-left p-3 font-medium w-1/5">Probation</th>
              <th className="text-left p-3 font-medium w-1/5">Passed</th>
              <th className="text-left p-3 font-medium w-1/5">Target</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row, index) => <tr key={index} className="border-b border-border/30 hover:bg-accent/30">
                <td className="p-3">{row.month}</td>
                <td className="p-3">
                  <EditableCell value={row.onboardingStaff} onEdit={val => handleCellEdit(index, 'onboardingStaff', val)} />
                </td>
                <td className="p-3">
                  <EditableCell value={row.probationStaff} onEdit={val => handleCellEdit(index, 'probationStaff', val)} />
                </td>
                <td className="p-3">
                  <EditableCell value={row.currentStaff} onEdit={val => handleCellEdit(index, 'currentStaff', val)} />
                </td>
                <td className="p-3">
                  <EditableCell value={row.idealStaff} onEdit={val => handleCellEdit(index, 'idealStaff', val)} />
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      {/* Metrics Cards */}
      

      {/* Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          
          
        </div>
        <Card className="p-4 bg-white">
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="currentStaff" fill="#3b82f6" name="Current Staff" stackId="staff" />
                <Bar dataKey="probationStaff" fill="#f59e0b" name="Probation Staff" stackId="staff" />
                <Bar dataKey="onboardingStaff" fill="#8b5cf6" name="Onboarding Staff" stackId="staff" />
                <Line type="monotone" dataKey="idealStaff" stroke="#22c55e" strokeWidth={2} dot={{
                r: 3,
                fill: "#22c55e"
              }} name="Ideal Staff" />
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
    </div>;
};