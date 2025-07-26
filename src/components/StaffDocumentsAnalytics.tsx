import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
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
    return <div className="flex items-center justify-between p-3 border border-border/30 rounded">
        <span className="text-sm">{label}</span>
        <Input value={value} onChange={e => onEdit(e.target.value)} className="w-16 h-8 text-sm text-right [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style={{
        MozAppearance: 'textfield'
      }} type="number" min="0" />
      </div>;
  };

  // Calculate bar chart data
  const total = Object.values(documentsData).reduce((sum, val) => sum + val, 0);
  const barData = total > 0 ? [{
    name: "Active - Fully Compliant",
    value: documentsData.activeFullyCompliant,
    fill: "#22c55e"
  }, {
    name: "Active - Pending Documents",
    value: documentsData.activePendingDocuments,
    fill: "#f59e0b"
  }, {
    name: "Onboarding - Pending Documents",
    value: documentsData.onboardingPendingDocuments,
    fill: "#ef4444"
  }, {
    name: "Onboarding - Fully Compliant",
    value: documentsData.onboardingFullyCompliant,
    fill: "#3b82f6"
  }].filter(item => item.value > 0) : [];
  return <div className="space-y-8 mt-6 p-8 border border-border rounded-lg bg-neutral-50 min-h-[600px] w-full">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-semibold text-foreground">📋 Staff Documents Analytics</h4>
        
      </div>
      
      {/* Staff Documents Input Section */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">Staff Documents Numbers</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableInput value={documentsData.activeFullyCompliant} onEdit={val => handleInputChange('activeFullyCompliant', val)} label="Active - Fully Compliant" />
          <EditableInput value={documentsData.activePendingDocuments} onEdit={val => handleInputChange('activePendingDocuments', val)} label="Active - Pending Documents" />
          <EditableInput value={documentsData.onboardingPendingDocuments} onEdit={val => handleInputChange('onboardingPendingDocuments', val)} label="Onboarding - Pending Documents" />
          <EditableInput value={documentsData.onboardingFullyCompliant} onEdit={val => handleInputChange('onboardingFullyCompliant', val)} label="Onboarding - Fully Compliant" />
        </div>
      </div>

      {/* Bar Chart Section */}
      {total > 0 && <div className="space-y-4">
          <div className="text-sm font-medium text-foreground">Staff Documents Breakdown</div>
          
          <Card className="p-8">
            <div className="flex flex-col items-center gap-8">
              <div className="text-lg font-semibold text-center">Staff Documents Status Overview</div>
              
              <div className="w-full h-[400px]">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                      <XAxis dataKey="name" tick={{
                    fontSize: 12
                  }} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {barData.map(entry => <div key={entry.name} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{
                backgroundColor: entry.fill
              }} />
                    <span className="text-sm font-medium">{entry.name}</span>
                  </div>)}
              </div>
            </div>
          </Card>
        </div>}
    </div>;
};