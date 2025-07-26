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
  fullyCompliant: {
    label: "Compliant",
    color: "#22c55e"
  },
  pendingDocuments: {
    label: "Pending Documents",
    color: "#f59e0b"
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
        <Input value={value} onChange={e => onEdit(e.target.value)} style={{
        MozAppearance: 'textfield'
      }} type="number" min="0" className="w-16 h-8 text-sm text-right [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-white" />
      </div>;
  };

  // Calculate bar chart data with stacking
  const total = Object.values(documentsData).reduce((sum, val) => sum + val, 0);

  // Calculate totals and percentages for each category
  const activeTotal = documentsData.activeFullyCompliant + documentsData.activePendingDocuments;
  const onboardingTotal = documentsData.onboardingFullyCompliant + documentsData.onboardingPendingDocuments;
  const activePendingPercentage = activeTotal > 0 ? Math.round(documentsData.activePendingDocuments / activeTotal * 100) : 0;
  const activeCompliantPercentage = activeTotal > 0 ? Math.round(documentsData.activeFullyCompliant / activeTotal * 100) : 0;
  const onboardingPendingPercentage = onboardingTotal > 0 ? Math.round(documentsData.onboardingPendingDocuments / onboardingTotal * 100) : 0;
  const onboardingCompliantPercentage = onboardingTotal > 0 ? Math.round(documentsData.onboardingFullyCompliant / onboardingTotal * 100) : 0;
  const barData = total > 0 ? [{
    name: "Active Staff",
    fullyCompliant: documentsData.activeFullyCompliant,
    pendingDocuments: documentsData.activePendingDocuments
  }, {
    name: "Onboarding Staff",
    fullyCompliant: documentsData.onboardingFullyCompliant,
    pendingDocuments: documentsData.onboardingPendingDocuments
  }].filter(item => item.fullyCompliant + item.pendingDocuments > 0) : [];
  return <div className="space-y-8 mt-6 p-8 border border-border rounded-lg min-h-[600px] w-full bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-semibold text-foreground">Staff Documents Analytics</h4>
        
      </div>
      
      {/* Staff Documents Input Section */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">Staff Documents Numbers</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableInput value={documentsData.activeFullyCompliant} onEdit={val => handleInputChange('activeFullyCompliant', val)} label="Active - Compliant" />
          <EditableInput value={documentsData.activePendingDocuments} onEdit={val => handleInputChange('activePendingDocuments', val)} label="Active - Pending Documents" />
          <EditableInput value={documentsData.onboardingPendingDocuments} onEdit={val => handleInputChange('onboardingPendingDocuments', val)} label="Onboarding - Pending Documents" />
          <EditableInput value={documentsData.onboardingFullyCompliant} onEdit={val => handleInputChange('onboardingFullyCompliant', val)} label="Onboarding - Compliant" />
        </div>
      </div>

      {/* Bar Chart Section */}
      {total > 0 && <div className="space-y-4">
          <div className="text-sm font-medium text-foreground">Staff Documents Breakdown</div>
          
          <Card className="p-8 bg-white">
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
                       <Bar dataKey="fullyCompliant" stackId="a" fill="#22c55e" />
                       <Bar dataKey="pendingDocuments" stackId="a" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              
               {/* Legend and Percentages */}
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded bg-[#22c55e]" />
                     <span className="text-sm font-medium">Compliant</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded bg-[#f59e0b]" />
                     <span className="text-sm font-medium">Pending Documents</span>
                   </div>
                 </div>
                 
                 {/* Percentage Breakdown */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                   {activeTotal > 0 && <div className="space-y-2">
                       <h5 className="font-medium text-foreground">Active Staff</h5>
                       <div className="text-sm text-muted-foreground">
                         <div>Compliant: {activeCompliantPercentage}%</div>
                         
                       </div>
                     </div>}
                   {onboardingTotal > 0 && <div className="space-y-2">
                       <h5 className="font-medium text-foreground">Onboarding Staff</h5>
                       <div className="text-sm text-muted-foreground">
                         <div>Compliant: {onboardingCompliantPercentage}%</div>
                         
                       </div>
                     </div>}
                 </div>
               </div>
            </div>
          </Card>
        </div>}
    </div>;
};