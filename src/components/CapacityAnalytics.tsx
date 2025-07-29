import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

interface StaffEntry {
  id: string;
  timestamp: string;
  onboardingStaff: number;
  probationStaff: number;
  currentStaff: number;
  idealStaff: number;
}

const generateChartData = (entries: StaffEntry[]) => {
  const weeks = [];
  const currentDate = new Date();
  
  for (let i = 11; i >= 0; i--) {
    // Calculate week start (Monday) and end (Sunday)
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1) - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Format week label (e.g., "Dec 4" or "Jan 15")
    const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Find the most recent entry for this week
    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
    
    const latestEntry = weekEntries.length > 0 
      ? weekEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      : null;
    
    weeks.push({
      month: weekLabel, // Keep the same property name for chart compatibility
      onboardingStaff: latestEntry?.onboardingStaff || 0,
      probationStaff: latestEntry?.probationStaff || 0,
      currentStaff: latestEntry?.currentStaff || 0,
      idealStaff: latestEntry?.idealStaff || 0
    });
  }
  
  return weeks;
};

const chartConfig = {
  onboardingStaff: {
    label: "Onboarding Staff",
    color: "hsl(var(--chart-1))",
  },
  probationStaff: {
    label: "Probation Staff",
    color: "hsl(var(--chart-2))",
  },
  currentStaff: {
    label: "Current Staff",
    color: "hsl(var(--chart-3))",
  },
  idealStaff: {
    label: "Ideal Staff",
    color: "hsl(var(--chart-4))",
  },
};

interface CapacityAnalyticsProps {
  onMonthlyStaffDataChange?: (data: Array<{month: string, currentStaff: number, probationStaff?: number}>) => void;
  meetingDate?: Date;
  meetingId?: string;
}

export const CapacityAnalytics = ({ onMonthlyStaffDataChange, meetingDate, meetingId }: CapacityAnalyticsProps) => {
  const { profile } = useAuth();
  useTheme();
  const [entries, setEntries] = useState<StaffEntry[]>([]);
  const [chartData, setChartData] = useState(generateChartData([]));
  const [currentInput, setCurrentInput] = useState({
    onboardingStaff: 0,
    probationStaff: 0,
    currentStaff: 0,
    idealStaff: 0
  });

  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id, meetingId]);

  useEffect(() => {
    const newChartData = generateChartData(entries);
    setChartData(newChartData);
    
    // Notify parent component of monthly staff data changes
    if (onMonthlyStaffDataChange) {
      const staffData = newChartData.map(item => ({
        month: item.month,
        currentStaff: item.currentStaff,
        probationStaff: item.probationStaff
      }));
      onMonthlyStaffDataChange(staffData);
    }
  }, [entries, onMonthlyStaffDataChange]);

  const loadData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', profile.company_id)
        .eq('data_type', 'resourcing_analytics')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading resourcing analytics:', error);
        return;
      }

      if (data?.data_content && typeof data.data_content === 'object' && 'entries' in data.data_content) {
        const loadedEntries = (data.data_content as any).entries as StaffEntry[];
        // Filter to only show entries from the last 12 weeks
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7));
        
        const recentEntries = loadedEntries.filter(entry => 
          new Date(entry.timestamp) >= twelveWeeksAgo
        );
        
        setEntries(recentEntries);
        console.log('Successfully loaded resourcing analytics data');
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading resourcing analytics:', error);
      setEntries([]);
    }
  };

  const saveData = async (newEntries: StaffEntry[]) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('dashboard_data')
        .upsert({
          company_id: profile.company_id,
          meeting_id: meetingId || null,
          data_type: 'resourcing_analytics',
          data_content: { entries: newEntries } as any
        }, {
          onConflict: 'company_id,data_type'
        });

      if (error) {
        console.error('Error saving resourcing analytics:', error);
      } else {
        console.log('Successfully saved resourcing analytics data');
      }
    } catch (error) {
      console.error('Error saving resourcing analytics:', error);
    }
  };

  const handleInputChange = (field: keyof typeof currentInput, value: string) => {
    setCurrentInput(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  const handleSubmit = () => {
    const newEntry: StaffEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...currentInput
    };

    const updatedEntries = [...entries, newEntry];
    
    // Keep only entries from the last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7));
    
    const filteredEntries = updatedEntries.filter(entry => 
      new Date(entry.timestamp) >= twelveWeeksAgo
    );

    setEntries(filteredEntries);
    saveData(filteredEntries);
    
    // Reset form
    setCurrentInput({
      onboardingStaff: 0,
      probationStaff: 0,
      currentStaff: 0,
      idealStaff: 0
    });
  };

  const getLatestEntry = () => {
    if (entries.length === 0) return null;
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const latestEntry = getLatestEntry();

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Resourcing Analytics</h4>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Track your staffing levels over time. Enter current numbers and they'll be timestamped and added to your chart (Last 12 Weeks)
      </div>

      {/* Current Values Display */}
      {latestEntry && (
        <Card className="p-4 bg-accent/50">
          <div className="text-sm font-medium text-foreground mb-2">
            Latest Entry ({new Date(latestEntry.timestamp).toLocaleDateString()})
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Onboarding:</div>
              <div className="font-medium">{latestEntry.onboardingStaff}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Probation:</div>
              <div className="font-medium">{latestEntry.probationStaff}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Passed:</div>
              <div className="font-medium">{latestEntry.currentStaff}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Target:</div>
              <div className="font-medium">{latestEntry.idealStaff}</div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Input Form */}
      <Card className="p-4">
        <div className="text-sm font-medium text-foreground mb-4">Add New Entry</div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Onboarding Staff</label>
            <Input
              type="number"
              value={currentInput.onboardingStaff}
              onChange={(e) => handleInputChange('onboardingStaff', e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Probation Staff</label>
            <Input
              type="number"
              value={currentInput.probationStaff}
              onChange={(e) => handleInputChange('probationStaff', e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Passed Staff</label>
            <Input
              type="number"
              value={currentInput.currentStaff}
              onChange={(e) => handleInputChange('currentStaff', e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Target Staff</label>
            <Input
              type="number"
              value={currentInput.idealStaff}
              onChange={(e) => handleInputChange('idealStaff', e.target.value)}
              className="h-8"
            />
          </div>
        </div>
        <Button onClick={handleSubmit} className="w-full">
          Add Entry
        </Button>
      </Card>

      {/* Chart */}
      <Card className="p-4 bg-white">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={chartData} 
              margin={{ top: 5, right: 5, bottom: 25, left: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="currentStaff" fill="#3b82f6" name="Passed" stackId="staff" />
              <Bar dataKey="probationStaff" fill="#f59e0b" name="Probation" stackId="staff" />
              <Bar dataKey="onboardingStaff" fill="#8b5cf6" name="Onboarding" stackId="staff" />
              <Line 
                type="monotone" 
                dataKey="idealStaff" 
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22c55e" }}
                name="Target"
              />
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
  );
};
