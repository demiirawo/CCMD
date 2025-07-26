import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { X } from "lucide-react";

interface MonthlyData {
  month: string;
  mandatoryComplete: number;
  mandatoryTotal: number;
  specialistComplete: number;
  specialistTotal: number;
}

interface CurrentMetrics {
  mandatoryComplete: number;
  mandatoryIncomplete: number;
  specialistComplete: number;
  specialistIncomplete: number;
}

const generateInitialData = (): MonthlyData[] => {
  const months = [
    "Aug 24", "Sep 24", "Oct 24", "Nov 24", "Dec 24", "Jan 25", 
    "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25", "Jul 25"
  ];
  
  return months.map(month => ({
    month,
    mandatoryComplete: 0,
    mandatoryTotal: 0,
    specialistComplete: 0,
    specialistTotal: 0
  }));
};

const chartConfig = {
  mandatoryPercentage: {
    label: "Mandatory Training %",
    color: "#3b82f6"
  },
  specialistPercentage: {
    label: "Specialist Training %", 
    color: "#22c55e"
  }
};

interface StaffTrainingAnalyticsProps {
  onClose?: () => void;
}

export const StaffTrainingAnalytics = ({ onClose }: StaffTrainingAnalyticsProps) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>(generateInitialData());
  const [currentMetrics, setCurrentMetrics] = useState<CurrentMetrics>({
    mandatoryComplete: 18,
    mandatoryIncomplete: 7,
    specialistComplete: 12,
    specialistIncomplete: 13
  });

  const handleTableCellEdit = (rowIndex: number, field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setMonthlyData(prev => 
      prev.map((row, index) => 
        index === rowIndex ? { ...row, [field]: numValue } : row
      )
    );
  };

  const handleCurrentMetricEdit = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setCurrentMetrics(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const EditableCell = ({ 
    value, 
    onEdit, 
    className = "w-16 h-8 text-sm text-center" 
  }: { 
    value: number; 
    onEdit: (val: string) => void; 
    className?: string;
  }) => (
    <Input
      value={value}
      onChange={(e) => onEdit(e.target.value)}
      className={`${className} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      style={{ MozAppearance: 'textfield' }}
      type="number"
      min="0"
    />
  );

  // Calculate percentages for chart
  const chartData = monthlyData.map(data => ({
    month: data.month,
    mandatoryPercentage: data.mandatoryTotal > 0 ? Math.round((data.mandatoryComplete / data.mandatoryTotal) * 100) : 0,
    specialistPercentage: data.specialistTotal > 0 ? Math.round((data.specialistComplete / data.specialistTotal) * 100) : 0
  }));

  return (
    <div className="bg-white rounded-lg border border-border/30 overflow-hidden">
      <div className="p-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="summary">Summary (12 Months)</TabsTrigger>
            <TabsTrigger value="mandatory">Mandatory Training</TabsTrigger>
            <TabsTrigger value="specialist">Specialist Training</TabsTrigger>
          </TabsList>

            <TabsContent value="summary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Training Completion Percentages - Past 12 Months</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis domain={[0, 100]} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="mandatoryPercentage" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="specialistPercentage" 
                            stroke="#22c55e" 
                            strokeWidth={2}
                            dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mandatory" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Mandatory Training Data (Past 12 Months)</h3>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Month</th>
                            <th className="text-left py-3 px-4 font-medium">Complete</th>
                            <th className="text-left py-3 px-4 font-medium">Total Staff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyData.map((data, index) => (
                            <tr key={data.month} className="border-b">
                              <td className="py-3 px-4">{data.month}</td>
                              <td className="py-3 px-4">
                                <EditableCell
                                  value={data.mandatoryComplete}
                                  onEdit={(val) => handleTableCellEdit(index, 'mandatoryComplete', val)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <EditableCell
                                  value={data.mandatoryTotal}
                                  onEdit={(val) => handleTableCellEdit(index, 'mandatoryTotal', val)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4">Current Month Numbers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Active Staff - All Mandatory Training Complete</span>
                          <EditableCell
                            value={currentMetrics.mandatoryComplete}
                            onEdit={(val) => handleCurrentMetricEdit('mandatoryComplete', val)}
                            className="w-20 h-10 text-center"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Active Staff - Mandatory Training Incomplete</span>
                          <EditableCell
                            value={currentMetrics.mandatoryIncomplete}
                            onEdit={(val) => handleCurrentMetricEdit('mandatoryIncomplete', val)}
                            className="w-20 h-10 text-center"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specialist" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Specialist Training Data (Past 12 Months)</h3>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Month</th>
                            <th className="text-left py-3 px-4 font-medium">Complete</th>
                            <th className="text-left py-3 px-4 font-medium">Total Staff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyData.map((data, index) => (
                            <tr key={data.month} className="border-b">
                              <td className="py-3 px-4">{data.month}</td>
                              <td className="py-3 px-4">
                                <EditableCell
                                  value={data.specialistComplete}
                                  onEdit={(val) => handleTableCellEdit(index, 'specialistComplete', val)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <EditableCell
                                  value={data.specialistTotal}
                                  onEdit={(val) => handleTableCellEdit(index, 'specialistTotal', val)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4">Current Month Numbers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Active Staff - All Specialist Training Complete</span>
                          <EditableCell
                            value={currentMetrics.specialistComplete}
                            onEdit={(val) => handleCurrentMetricEdit('specialistComplete', val)}
                            className="w-20 h-10 text-center"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Active Staff - Specialist Training Incomplete</span>
                          <EditableCell
                            value={currentMetrics.specialistIncomplete}
                            onEdit={(val) => handleCurrentMetricEdit('specialistIncomplete', val)}
                            className="w-20 h-10 text-center"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };