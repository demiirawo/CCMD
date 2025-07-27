import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

const generateInitialData = (meetingDate?: Date) => {
  const months = [];
  const now = meetingDate || new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    months.push({
      month: monthName,
      incidents: 0,
      accidents: 0,
      safeguarding: 0,
      resolved: 0,
      total: 0
    });
  }
  
  return months;
};

const chartConfig = {
  incidents: {
    label: "Incidents",
    color: "hsl(var(--chart-1))",
  },
  accidents: {
    label: "Accidents", 
    color: "hsl(var(--chart-2))",
  },
  safeguarding: {
    label: "Safeguarding",
    color: "hsl(var(--chart-3))",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-4))",
  },
};

interface EditableCellProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
}

const EditableCell = ({ value, onValueChange, className = "" }: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value.toString());
  };

  const handleSave = () => {
    const numValue = parseInt(editValue) || 0;
    onValueChange(numValue);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value.toString());
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        className={`w-full px-2 py-1 text-center border rounded ${className}`}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={handleEdit}
      className={`cursor-pointer hover:bg-accent/20 px-2 py-1 rounded text-center ${className}`}
    >
      {value}
    </div>
  );
};

interface IncidentsAnalyticsProps {
  meetingDate?: Date;
}

export const IncidentsAnalytics = ({ meetingDate }: IncidentsAnalyticsProps) => {
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));

  const handleCellEdit = (monthIndex: number, field: 'incidents' | 'accidents' | 'safeguarding' | 'resolved', value: number) => {
    setMonthlyData(prev => {
      const newData = [...prev];
      newData[monthIndex] = { 
        ...newData[monthIndex], 
        [field]: value,
        // Recalculate total when incidents, accidents, or safeguarding change
        total: field === 'resolved' 
          ? newData[monthIndex].total 
          : (field === 'incidents' ? value : newData[monthIndex].incidents) +
            (field === 'accidents' ? value : newData[monthIndex].accidents) +
            (field === 'safeguarding' ? value : newData[monthIndex].safeguarding)
      };
      return newData;
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Incidents & Safeguarding Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Data Input Table */}
          <div className="bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left p-3 font-medium">Month</th>
                    <th className="text-center p-3 font-medium">Incidents</th>
                    <th className="text-center p-3 font-medium">Accidents</th>
                    <th className="text-center p-3 font-medium">Safeguarding</th>
                    <th className="text-center p-3 font-medium">Resolved</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, index) => (
                    <tr key={data.month} className="border-b hover:bg-muted/10">
                      <td className="p-3 font-medium">{data.month}</td>
                      <td className="p-3">
                        <EditableCell
                          value={data.incidents}
                          onValueChange={(value) => handleCellEdit(index, 'incidents', value)}
                        />
                      </td>
                      <td className="p-3">
                        <EditableCell
                          value={data.accidents}
                          onValueChange={(value) => handleCellEdit(index, 'accidents', value)}
                        />
                      </td>
                      <td className="p-3">
                        <EditableCell
                          value={data.safeguarding}
                          onValueChange={(value) => handleCellEdit(index, 'safeguarding', value)}
                        />
                      </td>
                      <td className="p-3">
                        <EditableCell
                          value={data.resolved}
                          onValueChange={(value) => handleCellEdit(index, 'resolved', value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div className="h-72 w-full p-4 bg-background rounded-lg border">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={monthlyData} 
                  margin={{ top: 5, right: 5, bottom: 25, left: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="incidents" 
                    stackId="cases"
                    fill="var(--color-incidents)" 
                    name="Incidents"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="accidents" 
                    stackId="cases"
                    fill="var(--color-accidents)" 
                    name="Accidents"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="safeguarding" 
                    stackId="cases"
                    fill="var(--color-safeguarding)" 
                    name="Safeguarding"
                    radius={[2, 2, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="var(--color-resolved)" 
                    strokeWidth={2}
                    dot={{ fill: "var(--color-resolved)", strokeWidth: 1, r: 3 }}
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