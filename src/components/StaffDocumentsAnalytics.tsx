import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const initialDocumentsData = {
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

export const StaffDocumentsAnalytics = () => {
  const [documentsData, setDocumentsData] = useState(initialDocumentsData);

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setDocumentsData(prev => ({
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
          className="w-16 h-8 text-sm text-right [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ MozAppearance: 'textfield' }}
          type="number"
          min="0"
        />
      </div>
    );
  };

  // Calculate pie chart data
  const total = Object.values(documentsData).reduce((sum, val) => sum + val, 0);
  const pieData = total > 0 ? [
    {
      name: "Active - Fully Compliant",
      value: documentsData.activeFullyCompliant,
      percentage: Math.round((documentsData.activeFullyCompliant / total) * 100),
      color: "#22c55e"
    },
    {
      name: "Active - Pending Documents",
      value: documentsData.activePendingDocuments,
      percentage: Math.round((documentsData.activePendingDocuments / total) * 100),
      color: "#f59e0b"
    },
    {
      name: "Onboarding - Pending Documents",
      value: documentsData.onboardingPendingDocuments,
      percentage: Math.round((documentsData.onboardingPendingDocuments / total) * 100),
      color: "#ef4444"
    },
    {
      name: "Onboarding - Fully Compliant",
      value: documentsData.onboardingFullyCompliant,
      percentage: Math.round((documentsData.onboardingFullyCompliant / total) * 100),
      color: "#3b82f6"
    }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-8 mt-6 p-8 border border-border rounded-lg bg-neutral-50 min-h-[600px] w-full">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-semibold text-foreground">📋 Staff Documents Analytics</h4>
        <button className="text-muted-foreground hover:text-foreground">✕</button>
      </div>
      
      {/* Staff Documents Input Section */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">Staff Documents Numbers</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableInput
            value={documentsData.activeFullyCompliant}
            onEdit={(val) => handleInputChange('activeFullyCompliant', val)}
            label="Active - Fully Compliant"
          />
          <EditableInput
            value={documentsData.activePendingDocuments}
            onEdit={(val) => handleInputChange('activePendingDocuments', val)}
            label="Active - Pending Documents"
          />
          <EditableInput
            value={documentsData.onboardingPendingDocuments}
            onEdit={(val) => handleInputChange('onboardingPendingDocuments', val)}
            label="Onboarding - Pending Documents"
          />
          <EditableInput
            value={documentsData.onboardingFullyCompliant}
            onEdit={(val) => handleInputChange('onboardingFullyCompliant', val)}
            label="Onboarding - Fully Compliant"
          />
        </div>
      </div>

      {/* Pie Chart Section */}
      {total > 0 && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-foreground">Staff Documents Breakdown</div>
          
          <Card className="p-8">
            <div className="flex flex-col items-center gap-8">
              <div className="text-lg font-semibold text-center">Staff Documents Status Overview</div>
              
              <div className="relative w-[600px] h-[500px] flex items-center justify-center">
                <div className="w-64 h-64">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={104}
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
                
                {/* Percentage labels around chart */}
                {pieData.map((entry, index) => {
                  const angle = (index * (360 / pieData.length)) + (360 / pieData.length / 2);
                  const radian = (angle * Math.PI) / 180;
                  const radius = 220;
                  const x = 300 + radius * Math.cos(radian - Math.PI / 2);
                  const y = 250 + radius * Math.sin(radian - Math.PI / 2);
                  
                  return (
                    <div
                      key={entry.name}
                      className="absolute text-sm font-medium whitespace-nowrap px-2 py-1 rounded bg-background/80 border"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                        color: entry.color,
                        borderColor: entry.color
                      }}
                    >
                      {entry.percentage}%
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium">{entry.name}</span>
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