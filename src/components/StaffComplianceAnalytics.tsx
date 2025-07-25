import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const initialComplianceData = {
  activeFullyCompliant: 0,
  activePendingDocuments: 0,
  onboardingPendingDocuments: 0,
  onboardingFullyCompliant: 0
};

const chartConfig = {
  activeFullyCompliant: {
    label: "Active - Fully Compliant",
    color: "#22c55e"
  },
  activePendingDocuments: {
    label: "Active - Pending Documents",
    color: "#f59e0b"
  },
  onboardingPendingDocuments: {
    label: "Onboarding - Pending Documents",
    color: "#ef4444"
  },
  onboardingFullyCompliant: {
    label: "Onboarding - Fully Compliant",
    color: "#3b82f6"
  }
};

export const StaffComplianceAnalytics = () => {
  const [complianceData, setComplianceData] = useState(initialComplianceData);

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setComplianceData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const EditableInput = ({
    value,
    onEdit,
    label
  }: {
    value: number;
    onEdit: (val: string) => void;
    label: string;
  }) => {
    return (
      <div className="flex items-center justify-between p-3 border border-border/30 rounded">
        <span className="text-sm">{label}</span>
        <Input 
          value={value} 
          onChange={(e) => onEdit(e.target.value)}
          className="w-16 h-8 text-sm text-right"
          type="number"
          min="0"
        />
      </div>
    );
  };

  // Calculate pie chart data
  const total = Object.values(complianceData).reduce((sum, val) => sum + val, 0);
  const pieData = total > 0 ? [
    {
      name: "Active - Fully Compliant",
      value: complianceData.activeFullyCompliant,
      percentage: Math.round((complianceData.activeFullyCompliant / total) * 100),
      color: "#22c55e"
    },
    {
      name: "Active - Pending Documents",
      value: complianceData.activePendingDocuments,
      percentage: Math.round((complianceData.activePendingDocuments / total) * 100),
      color: "#f59e0b"
    },
    {
      name: "Onboarding - Pending Documents",
      value: complianceData.onboardingPendingDocuments,
      percentage: Math.round((complianceData.onboardingPendingDocuments / total) * 100),
      color: "#ef4444"
    },
    {
      name: "Onboarding - Fully Compliant",
      value: complianceData.onboardingFullyCompliant,
      percentage: Math.round((complianceData.onboardingFullyCompliant / total) * 100),
      color: "#3b82f6"
    }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-8 mt-6 p-8 border border-border rounded-lg bg-neutral-50 min-h-[600px] w-full">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-semibold text-foreground">📋 Staff Compliance Analytics</h4>
        <button className="text-muted-foreground hover:text-foreground">✕</button>
      </div>
      
      {/* Staff Compliance Numbers */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">Staff Compliance Numbers</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableInput
            value={complianceData.activeFullyCompliant}
            onEdit={(val) => handleInputChange('activeFullyCompliant', val)}
            label="Active - Fully Compliant"
          />
          <EditableInput
            value={complianceData.activePendingDocuments}
            onEdit={(val) => handleInputChange('activePendingDocuments', val)}
            label="Active - Pending Documents"
          />
          <EditableInput
            value={complianceData.onboardingPendingDocuments}
            onEdit={(val) => handleInputChange('onboardingPendingDocuments', val)}
            label="Onboarding - Pending Documents"
          />
          <EditableInput
            value={complianceData.onboardingFullyCompliant}
            onEdit={(val) => handleInputChange('onboardingFullyCompliant', val)}
            label="Onboarding - Fully Compliant"
          />
        </div>
      </div>

      {/* Staff Compliance Breakdown */}
      {total > 0 && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-foreground">Staff Compliance Breakdown</div>
          
          <Card className="p-8">
            <div className="flex flex-col items-center gap-8">
              {/* Pie Chart with labels */}
              <div className="relative w-96 h-96 flex items-center justify-center">
                <div className="w-64 h-64">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                
                {/* Percentage labels positioned outside chart */}
                {pieData.map((entry, index) => {
                  const angle = (index * (360 / pieData.length)) + (360 / pieData.length / 2);
                  const radian = (angle * Math.PI) / 180;
                  const radius = 110;
                  const x = 50 + (radius * Math.cos(radian - Math.PI / 2)) / 3.84; // 384px / 100
                  const y = 50 + (radius * Math.sin(radian - Math.PI / 2)) / 3.84;
                  
                  return (
                    <div
                      key={entry.name}
                      className="absolute text-sm font-medium whitespace-nowrap"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                        color: entry.color
                      }}
                    >
                      {entry.name}: {entry.percentage}%
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="space-y-3">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};