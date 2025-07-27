import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
const initialTrainingData = {
  mandatoryPending: 0,
  mandatoryCompliant: 0,
  specialistPending: 0,
  specialistCompliant: 0
};
const chartConfig = {
  compliant: {
    label: "Compliant",
    color: "#22c55e"
  },
  pending: {
    label: "Pending",
    color: "#f59e0b"
  }
};

interface StaffTrainingAnalyticsProps {
  meetingId?: string;
}

export const StaffTrainingAnalytics = ({ meetingId }: StaffTrainingAnalyticsProps = {}) => {
  const [trainingData, setTrainingData] = useState(initialTrainingData);
  
  // Load data from database when component mounts or meetingId changes
  useEffect(() => {
    const loadData = async () => {
      if (meetingId) {
        const { data, error } = await supabase
          .from('staff_training_analytics')
          .select('*')
          .eq('meeting_id', meetingId)
          .maybeSingle();
        
        if (data) {
          setTrainingData({
            mandatoryPending: data.mandatory_pending,
            mandatoryCompliant: data.mandatory_compliant,
            specialistPending: data.specialist_pending,
            specialistCompliant: data.specialist_compliant
          });
        }
      }
    };
    
    loadData();
  }, [meetingId]);

  const handleInputChange = async (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const newData = {
      ...trainingData,
      [field]: numValue
    };
    setTrainingData(newData);

    // Always save to database immediately
    if (meetingId) {
      const { error } = await supabase
        .from('staff_training_analytics')
        .upsert({
          meeting_id: meetingId,
          mandatory_pending: newData.mandatoryPending,
          mandatory_compliant: newData.mandatoryCompliant,
          specialist_pending: newData.specialistPending,
          specialist_compliant: newData.specialistCompliant
        }, {
          onConflict: 'meeting_id'
        });
      
      if (error) {
        console.error('Error saving staff training data:', error);
      }
    }
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
  const total = Object.values(trainingData).reduce((sum, val) => sum + val, 0);

  // Calculate totals and percentages for each category
  const mandatoryTotal = trainingData.mandatoryCompliant + trainingData.mandatoryPending;
  const specialistTotal = trainingData.specialistCompliant + trainingData.specialistPending;
  const mandatoryCompliantPercentage = mandatoryTotal > 0 ? Math.round(trainingData.mandatoryCompliant / mandatoryTotal * 100) : 0;
  const mandatoryPendingPercentage = mandatoryTotal > 0 ? Math.round(trainingData.mandatoryPending / mandatoryTotal * 100) : 0;
  const specialistCompliantPercentage = specialistTotal > 0 ? Math.round(trainingData.specialistCompliant / specialistTotal * 100) : 0;
  const specialistPendingPercentage = specialistTotal > 0 ? Math.round(trainingData.specialistPending / specialistTotal * 100) : 0;
  const barData = total > 0 ? [{
    name: "Mandatory Training",
    compliant: trainingData.mandatoryCompliant,
    pending: trainingData.mandatoryPending
  }, {
    name: "Specialist Training",
    compliant: trainingData.specialistCompliant,
    pending: trainingData.specialistPending
  }].filter(item => item.compliant + item.pending > 0) : [];
  return <div className="space-y-8 mt-6 p-8 border border-border rounded-lg min-h-[600px] w-full bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-semibold text-foreground">Staff Training Analytics</h4>
      </div>
      
      {/* Staff Training Input Section */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">Staff Training Numbers</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableInput value={trainingData.mandatoryPending} onEdit={val => handleInputChange('mandatoryPending', val)} label="Mandatory Training - Staff Pending" />
          <EditableInput value={trainingData.mandatoryCompliant} onEdit={val => handleInputChange('mandatoryCompliant', val)} label="Mandatory Training - Staff Compliant" />
          <EditableInput value={trainingData.specialistPending} onEdit={val => handleInputChange('specialistPending', val)} label="Specialist Training - Staff Pending" />
          <EditableInput value={trainingData.specialistCompliant} onEdit={val => handleInputChange('specialistCompliant', val)} label="Specialist Training - Staff Compliant" />
        </div>
      </div>

      {/* Bar Chart Section */}
      {total > 0 && <div className="space-y-4">
          <div className="text-sm font-medium text-foreground">Staff Training Breakdown</div>
          
          <Card className="p-8 bg-white">
            <div className="flex flex-col items-center gap-8">
              <div className="text-lg font-semibold text-center">Staff Training Status Overview</div>
              
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
                      <Bar dataKey="compliant" stackId="a" fill="#22c55e" />
                      <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
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
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                </div>
                
                {/* Percentage Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                  {mandatoryTotal > 0 && <div className="space-y-2">
                      <h5 className="font-medium text-foreground">Mandatory Training</h5>
                      <div className="text-sm text-muted-foreground">
                        <div>Compliant: {mandatoryCompliantPercentage}%</div>
                        
                      </div>
                    </div>}
                  {specialistTotal > 0 && <div className="space-y-2">
                      <h5 className="font-medium text-foreground">Specialist Training</h5>
                      <div className="text-sm text-muted-foreground">
                        <div>Compliant: {specialistCompliantPercentage}%</div>
                        
                      </div>
                    </div>}
                </div>
              </div>
            </div>
          </Card>
        </div>}
    </div>;
};