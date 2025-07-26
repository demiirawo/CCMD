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
                
                {/* SVG for lines connecting pie slices to labels */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  {pieData.map((entry, index) => {
                    // Calculate cumulative percentage to find where this slice starts
                    let cumulativeValue = 0;
                    for (let i = 0; i < index; i++) {
                      cumulativeValue += pieData[i].value;
                    }
                    
                    // Calculate start angle and slice angle in degrees
                    const startAngleDeg = (cumulativeValue / total) * 360;
                    const sliceAngleDeg = (entry.value / total) * 360;
                    const centerAngleDeg = startAngleDeg + (sliceAngleDeg / 2);
                    
                    // Convert to radians (starting from top, going clockwise)
                    const centerAngleRad = ((centerAngleDeg - 90) * Math.PI) / 180;
                    
                    // Start point at edge of pie
                    const startRadius = 104;
                    const x1 = 300 + startRadius * Math.cos(centerAngleRad);
                    const y1 = 250 + startRadius * Math.sin(centerAngleRad);
                    
                    // End point for label positioning
                    const endRadius = 180;
                    const x2 = 300 + endRadius * Math.cos(centerAngleRad);
                    const y2 = 250 + endRadius * Math.sin(centerAngleRad);
                    
                    return (
                      <g key={`line-${index}`}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={entry.color}
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>
                
                {/* Percentage labels positioned outside */}
                {pieData.map((entry, index) => {
                  // Calculate cumulative percentage to find where this slice starts
                  let cumulativeValue = 0;
                  for (let i = 0; i < index; i++) {
                    cumulativeValue += pieData[i].value;
                  }
                  
                  // Calculate start angle and slice angle in degrees
                  const startAngleDeg = (cumulativeValue / total) * 360;
                  const sliceAngleDeg = (entry.value / total) * 360;
                  const centerAngleDeg = startAngleDeg + (sliceAngleDeg / 2);
                  
                  // Convert to radians (starting from top, going clockwise)
                  const centerAngleRad = ((centerAngleDeg - 90) * Math.PI) / 180;
                  
                  const radius = 190;
                  const x = 300 + radius * Math.cos(centerAngleRad);
                  const y = 250 + radius * Math.sin(centerAngleRad);
                  
                  return (
                    <div
                      key={entry.name}
                      className="absolute text-sm font-semibold px-3 py-1 rounded border-2 bg-background"
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