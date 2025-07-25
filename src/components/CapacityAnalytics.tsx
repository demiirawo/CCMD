import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

const monthlyData = [
  { month: "Aug 24", serviceUsers: 57, currentStaff: 17, minStaff: 14, idealStaff: 15 },
  { month: "Sep 24", serviceUsers: 53, currentStaff: 22, minStaff: 13, idealStaff: 29 },
  { month: "Oct 24", serviceUsers: 52, currentStaff: 14, minStaff: 14, idealStaff: 28 },
  { month: "Nov 24", serviceUsers: 30, currentStaff: 18, minStaff: 17, idealStaff: 16 },
  { month: "Dec 24", serviceUsers: 25, currentStaff: 24, minStaff: 10, idealStaff: 25 },
  { month: "Jan 25", serviceUsers: 44, currentStaff: 28, minStaff: 11, idealStaff: 26 },
  { month: "Feb 25", serviceUsers: 43, currentStaff: 25, minStaff: 15, idealStaff: 24 },
  { month: "Mar 25", serviceUsers: 28, currentStaff: 15, minStaff: 12, idealStaff: 16 },
  { month: "Apr 25", serviceUsers: 34, currentStaff: 15, minStaff: 15, idealStaff: 18 },
  { month: "May 25", serviceUsers: 54, currentStaff: 16, minStaff: 15, idealStaff: 22 },
  { month: "Jun 25", serviceUsers: 35, currentStaff: 21, minStaff: 16, idealStaff: 20 },
  { month: "Jul 25", serviceUsers: 56, currentStaff: 26, minStaff: 12, idealStaff: 28 }
];

const currentMetrics = {
  activeServiceUsers: 54,
  currentStaffingLevel: 25,
  minimumStaffingLevel: 12,
  idealStaffingLevel: 29,
  capacityCoverage: 86.2
};

const chartConfig = {
  serviceUsers: {
    label: "Service Users",
    color: "hsl(var(--chart-1))",
  },
  currentStaff: {
    label: "Current Staff",
    color: "hsl(var(--chart-2))",
  },
  minStaff: {
    label: "Min Staff",
    color: "hsl(var(--chart-3))",
  },
  idealStaff: {
    label: "Ideal Staff",
    color: "hsl(var(--chart-4))",
  },
};

export const CapacityAnalytics = () => {
  return (
    <div className="space-y-6 mt-4 p-4 bg-muted/30 rounded-lg">
      <h4 className="text-lg font-semibold text-foreground">Capacity Analytics</h4>
      
      <div className="text-sm text-muted-foreground mb-4">Monthly Data (Past 12 Months)</div>
      
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-medium">Month</th>
              <th className="text-left p-2 font-medium">Service Users</th>
              <th className="text-left p-2 font-medium">Current Staff</th>
              <th className="text-left p-2 font-medium">Min Staff</th>
              <th className="text-left p-2 font-medium">Ideal Staff</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row, index) => (
              <tr key={index} className="border-b border-border/30">
                <td className="p-2">{row.month}</td>
                <td className="p-2">{row.serviceUsers}</td>
                <td className="p-2">{row.currentStaff}</td>
                <td className="p-2">{row.minStaff}</td>
                <td className="p-2">{row.idealStaff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-purple-100 border-purple-200">
          <div className="text-xs text-muted-foreground mb-1">Active Service Users</div>
          <div className="text-2xl font-bold">{currentMetrics.activeServiceUsers}</div>
        </Card>
        
        <Card className="p-4 bg-blue-100 border-blue-200">
          <div className="text-xs text-muted-foreground mb-1">Current Staffing Level</div>
          <div className="text-2xl font-bold">{currentMetrics.currentStaffingLevel}</div>
        </Card>
        
        <Card className="p-4 bg-red-100 border-red-200">
          <div className="text-xs text-muted-foreground mb-1">Minimum Staffing Level</div>
          <div className="text-2xl font-bold">{currentMetrics.minimumStaffingLevel}</div>
        </Card>
        
        <Card className="p-4 bg-green-100 border-green-200">
          <div className="text-xs text-muted-foreground mb-1">Ideal Staffing Level</div>
          <div className="text-2xl font-bold">{currentMetrics.idealStaffingLevel}</div>
        </Card>
        
        <Card className="p-4 bg-orange-100 border-orange-200">
          <div className="text-xs text-muted-foreground mb-1">Capacity Coverage</div>
          <div className="text-2xl font-bold">{currentMetrics.capacityCoverage}%</div>
          <div className="text-xs text-orange-600 mt-1">Insufficient</div>
        </Card>
      </div>

      {/* Chart */}
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Charts</div>
        <Card className="p-4">
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
                <Line 
                  type="monotone" 
                  dataKey="serviceUsers" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="currentStaff" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="minStaff" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="idealStaff" 
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="text-xs text-center text-muted-foreground mt-2">
            Graph 1: Trends Over Past 12 Months
          </div>
        </Card>
      </div>
    </div>
  );
};