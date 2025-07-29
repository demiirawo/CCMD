import React, { useState, useEffect, useCallback } from "react";
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

const generateChartData = (entries: StaffEntry[], meetingDate?: Date) => {
  const weeks = [];
  const referenceDate = meetingDate || new Date();
  
  // Calculate the Monday of the week containing the meeting date
  const meetingWeekStart = new Date(referenceDate);
  const dayOfWeek = meetingWeekStart.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so subtract 6; Monday = 1, so subtract 0
  meetingWeekStart.setDate(meetingWeekStart.getDate() - daysToSubtract);
  meetingWeekStart.setHours(0, 0, 0, 0);
  
  // Get current week start for comparison
  const currentWeekStart = new Date();
  const currentDayOfWeek = currentWeekStart.getDay();
  const currentDaysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  currentWeekStart.setDate(currentWeekStart.getDate() - currentDaysToSubtract);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  let lastKnownValues = { onboardingStaff: 0, probationStaff: 0, currentStaff: 0, idealStaff: 0 };
  
  for (let i = 11; i >= 0; i--) {
    // Calculate the week start for the current iteration (going backwards from meeting week)
    const weekStart = new Date(meetingWeekStart);
    weekStart.setDate(meetingWeekStart.getDate() - (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Format week label to show the week start date
    const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Find the most recent entry for this week
    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
    
    const latestEntry = weekEntries.length > 0 
      ? weekEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      : null;
    
    // Check if this is the current week and it's not concluded
    const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
    const isWeekConcluded = new Date() > weekEnd;
    
    let weekData;
    if (latestEntry) {
      // Week has data, update last known values
      lastKnownValues = {
        onboardingStaff: latestEntry.onboardingStaff,
        probationStaff: latestEntry.probationStaff,
        currentStaff: latestEntry.currentStaff,
        idealStaff: latestEntry.idealStaff
      };
      weekData = lastKnownValues;
    } else if (isCurrentWeek && !isWeekConcluded) {
      // Current week that's not concluded - leave blank
      weekData = { onboardingStaff: 0, probationStaff: 0, currentStaff: 0, idealStaff: 0 };
    } else {
      // Gap week - inherit from last known values
      weekData = lastKnownValues;
    }
    
    weeks.push({
      month: weekLabel,
      ...weekData
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
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);

  // Load draft input from localStorage on mount
  useEffect(() => {
    if (profile?.company_id && meetingId) {
      const draftKey = `resourcing_draft_${profile.company_id}_${meetingId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setCurrentInput(draft);
          setHasUnsavedDraft(true);
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    }
  }, [profile?.company_id, meetingId]);

  // Save draft to localStorage whenever input changes
  const saveDraft = useCallback((inputData: typeof currentInput) => {
    if (profile?.company_id && meetingId) {
      const draftKey = `resourcing_draft_${profile.company_id}_${meetingId}`;
      localStorage.setItem(draftKey, JSON.stringify(inputData));
      setHasUnsavedDraft(true);
    }
  }, [profile?.company_id, meetingId]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (profile?.company_id && meetingId) {
      const draftKey = `resourcing_draft_${profile.company_id}_${meetingId}`;
      localStorage.removeItem(draftKey);
      setHasUnsavedDraft(false);
    }
  }, [profile?.company_id, meetingId]);

  // Update input defaults when entries change (only if no draft exists)
  useEffect(() => {
    if (!hasUnsavedDraft) {
      const latest = getLatestEntry();
      if (latest) {
        setCurrentInput({
          onboardingStaff: latest.onboardingStaff,
          probationStaff: latest.probationStaff,
          currentStaff: latest.currentStaff,
          idealStaff: latest.idealStaff
        });
      }
    }
  }, [entries, hasUnsavedDraft]);

  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id, meetingId]);

  useEffect(() => {
    const newChartData = generateChartData(entries, meetingDate);
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
  }, [entries, meetingDate, onMonthlyStaffDataChange]);

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
    const newInput = {
      ...currentInput,
      [field]: parseInt(value) || 0
    };
    setCurrentInput(newInput);
    saveDraft(newInput);
  };

  const handleSubmit = () => {
    // Use meeting date as the base timestamp, or current date if no meeting date is set
    const baseDate = meetingDate || new Date();
    console.log('Creating new entry with meetingDate:', meetingDate);
    console.log('Using baseDate for timestamp:', baseDate);
    
    // Calculate the week start for the entry date
    const entryWeekStart = new Date(baseDate);
    const dayOfWeek = entryWeekStart.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    entryWeekStart.setDate(entryWeekStart.getDate() - daysToSubtract);
    entryWeekStart.setHours(0, 0, 0, 0);
    
    const entryWeekEnd = new Date(entryWeekStart);
    entryWeekEnd.setDate(entryWeekStart.getDate() + 6);
    entryWeekEnd.setHours(23, 59, 59, 999);
    
    // Remove any existing entries for the same week
    const entriesWithoutCurrentWeek = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return !(entryDate >= entryWeekStart && entryDate <= entryWeekEnd);
    });
    
    const newEntry: StaffEntry = {
      id: crypto.randomUUID(),
      timestamp: baseDate.toISOString(),
      ...currentInput
    };
    
    console.log('New entry created:', newEntry);
    console.log('Replacing any existing entries for week starting:', entryWeekStart.toDateString());

    const updatedEntries = [...entriesWithoutCurrentWeek, newEntry];
    
    // Keep only entries from the last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7));
    
    const filteredEntries = updatedEntries.filter(entry => 
      new Date(entry.timestamp) >= twelveWeeksAgo
    );

    setEntries(filteredEntries);
    saveData(filteredEntries);
    clearDraft(); // Clear the draft after successful submission
    
    // Keep the current values as defaults for next entry (they'll update via useEffect)
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
            Latest Entry ({meetingDate ? meetingDate.toLocaleDateString() : new Date(latestEntry.timestamp).toLocaleDateString()})
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
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-foreground">Add New Entry</div>
          {hasUnsavedDraft && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              Unsaved draft
            </div>
          )}
        </div>
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
