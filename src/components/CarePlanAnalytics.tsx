import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const generateInitialData = (meetingDate?: Date) => {
  const months = [];
  const currentDate = meetingDate || new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({
      month: monthName,
      highSU: 0,
      mediumSU: 0,
      lowSU: 0,
      completed: 0
    });
  }
  
  return months;
};

const chartConfig = {
  completed: {
    label: "Completed Reviews",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Target Reviews", 
    color: "hsl(var(--chart-2))",
  },
};

interface CarePlanAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const CarePlanAnalytics = ({ meetingDate, meetingId }: CarePlanAnalyticsProps) => {
  const { profile } = useAuth();
  useTheme();
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));
  const [frequencies, setFrequencies] = useState({
    highFrequency: 6,
    mediumFrequency: 12,
    lowFrequency: 24
  });
  const [currentViewStart, setCurrentViewStart] = useState(0);

  // Calculate which 4-month period the meeting date falls into
  const getMeetingDateViewStart = (meetingDate?: Date) => {
    if (!meetingDate) return 8; // Default to last 4 months if no meeting date
    
    const currentDate = new Date();
    const meetingMonth = meetingDate.getMonth();
    const meetingYear = meetingDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate how many months back the meeting date is from current date
    const monthsDiff = (currentYear - meetingYear) * 12 + (currentMonth - meetingMonth);
    
    // Each view shows 4 months, so calculate which view the meeting date should be in
    const viewIndex = Math.floor((11 - monthsDiff) / 4);
    return Math.max(0, Math.min(8, viewIndex * 4)); // Ensure it's within valid range (0-8)
  };

  // Set the initial view based on meeting date
  useEffect(() => {
    setCurrentViewStart(getMeetingDateViewStart(meetingDate));
  }, [meetingDate]);

  const visibleData = monthlyData.slice(currentViewStart, currentViewStart + 4);

  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id]);

  useEffect(() => {
    const newMonthStructure = generateInitialData(meetingDate);
    
    if (monthlyData.length > 0) {
      const preservedData = newMonthStructure.map(newMonth => {
        const existingMonth = monthlyData.find(existing => existing.month === newMonth.month);
        return existingMonth || newMonth;
      });
      setMonthlyData(preservedData);
    } else {
      setMonthlyData(newMonthStructure);
    }
  }, [meetingDate]);

  const loadData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('care_plan_analytics')
        .select('*')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading care plan analytics:', error);
        return;
      }

      if (data) {
        const savedFrequencies = (data.frequencies as any) || {};
        setFrequencies({
          highFrequency: savedFrequencies.highFrequency || 12,
          mediumFrequency: savedFrequencies.mediumFrequency || 6,
          lowFrequency: savedFrequencies.lowFrequency || 12
        });
        
        if (data.monthly_data) {
          const loadedData = data.monthly_data as any[];
          const currentStructure = generateInitialData(meetingDate);
          
          const mergedData = currentStructure.map(current => {
            const existing = loadedData.find(item => item.month === current.month);
            return existing || current;
          });
          
          setMonthlyData(mergedData);
        }
      } else {
        // Try to load from localStorage backup
        const backupKey = `care_plan_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            setFrequencies(backup.frequencies || { highFrequency: 12, mediumFrequency: 6, lowFrequency: 12 });
            if (backup.monthly_data) {
              const currentStructure = generateInitialData(meetingDate);
              const mergedData = currentStructure.map(current => {
                const existing = backup.monthly_data.find((item: any) => item.month === current.month);
                return existing || current;
              });
              setMonthlyData(mergedData);
            }
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading care plan analytics:', error);
      // Try to load from localStorage backup
      const backupKey = `care_plan_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backup = JSON.parse(backupData);
          setFrequencies(backup.frequencies || { highFrequency: 12, mediumFrequency: 6, lowFrequency: 12 });
          if (backup.monthly_data) {
            const currentStructure = generateInitialData(meetingDate);
            const mergedData = currentStructure.map(current => {
              const existing = backup.monthly_data.find((item: any) => item.month === current.month);
              return existing || current;
            });
            setMonthlyData(mergedData);
          }
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };

  const saveData = async (newFrequencies?: typeof frequencies, newMonthlyData?: typeof monthlyData) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('care_plan_analytics')
        .upsert({
          company_id: profile.company_id,
          meeting_id: meetingId,
          frequencies: newFrequencies || frequencies,
          monthly_data: newMonthlyData || monthlyData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,meeting_id'
        });

      if (error) {
        console.error('Error saving care plan analytics:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        const dataToBackup = {
          frequencies: newFrequencies || frequencies,
          monthly_data: newMonthlyData || monthlyData
        };
        localStorage.setItem(`care_plan_backup_${profile.company_id}`, JSON.stringify(dataToBackup));
      }
    } catch (error) {
      console.error('Error saving care plan analytics:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        const dataToBackup = {
          frequencies: newFrequencies || frequencies,
          monthly_data: newMonthlyData || monthlyData
        };
        localStorage.setItem(`care_plan_backup_${profile.company_id}`, JSON.stringify(dataToBackup));
      }
    }
  };

  const handleFrequencyChange = (field: keyof typeof frequencies, value: number) => {
    const newFrequencies = { ...frequencies, [field]: value };
    setFrequencies(newFrequencies);
    saveData(newFrequencies);
  };

  const handleCellEdit = (monthIndex: number, field: 'highSU' | 'mediumSU' | 'lowSU' | 'completed', value: number) => {
    const newData = [...monthlyData];
    const actualIndex = currentViewStart + monthIndex;
    newData[actualIndex] = { ...newData[actualIndex], [field]: value };
    setMonthlyData(newData);
    saveData(undefined, newData);
  };

  const handlePrevious = () => {
    setCurrentViewStart(Math.max(0, currentViewStart - 4));
  };

  const handleNext = () => {
    setCurrentViewStart(Math.min(8, currentViewStart + 4));
  };

  // Calculate targets based on service users and frequencies
  const dataWithTargets = visibleData.map((month) => {
    const fullMonthData = monthlyData.find(m => m.month === month.month) || month;
    const highTarget = Math.ceil(fullMonthData.highSU / frequencies.highFrequency);
    const mediumTarget = Math.ceil(fullMonthData.mediumSU / frequencies.mediumFrequency);
    const lowTarget = Math.ceil(fullMonthData.lowSU / frequencies.lowFrequency);
    
    return {
      ...month,
      target: highTarget + mediumTarget + lowTarget
    };
  });

  const EditableCell = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const handleStartEdit = () => {
      setEditing(true);
      setEditValue('');
    };

    const handleSave = () => {
      const numValue = parseInt(editValue) || 0;
      onChange(numValue);
      setEditing(false);
    };

    if (editing) {
      return (
        <Input 
          value={editValue} 
          onChange={e => setEditValue(e.target.value)} 
          onBlur={handleSave} 
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }} 
          className="w-16 h-8 text-sm" 
          autoFocus 
        />
      );
    }

    return (
      <span className="cursor-pointer hover:bg-accent/50 p-1 rounded" onClick={handleStartEdit}>
        {value}
      </span>
    );
  };

  const EditableInput = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const handleStartEdit = () => {
      setEditing(true);
      setEditValue(value.toString());
    };

    const handleSave = () => {
      const numValue = parseInt(editValue) || 1;
      onChange(Math.max(1, numValue));
      setEditing(false);
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}:</span>
        {editing ? (
          <Input 
            value={editValue} 
            onChange={e => setEditValue(e.target.value)} 
            onBlur={handleSave} 
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setEditing(false);
            }} 
            className="w-20 h-8 text-sm" 
            autoFocus 
          />
        ) : (
          <span className="cursor-pointer hover:bg-accent/50 p-1 rounded text-sm" onClick={handleStartEdit}>
            {value} {value === 1 ? 'month' : 'months'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Care Plan Analytics</h4>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevious}
            disabled={currentViewStart === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {visibleData[0]?.month} - {visibleData[visibleData.length - 1]?.month}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNext}
            disabled={currentViewStart >= 8}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly care plan review tracking with calculated targets</div>
      
      {/* Frequency Settings */}
      <div className="flex flex-wrap gap-6 p-4 bg-accent/30 rounded-lg">
        <EditableInput 
          label="High Risk Frequency" 
          value={frequencies.highFrequency} 
          onChange={(value) => handleFrequencyChange('highFrequency', value)} 
        />
        <EditableInput 
          label="Medium Risk Frequency" 
          value={frequencies.mediumFrequency} 
          onChange={(value) => handleFrequencyChange('mediumFrequency', value)} 
        />
        <EditableInput 
          label="Low Risk Frequency" 
          value={frequencies.lowFrequency} 
          onChange={(value) => handleFrequencyChange('lowFrequency', value)} 
        />
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {visibleData.map((row, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2 bg-primary text-primary-foreground px-3 py-2 rounded-t-lg -mx-3 -mt-3">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">High SU:</div>
                <EditableCell value={row.highSU} onChange={(value) => handleCellEdit(index, 'highSU', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Medium SU:</div>
                <EditableCell value={row.mediumSU} onChange={(value) => handleCellEdit(index, 'mediumSU', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Low SU:</div>
                <EditableCell value={row.lowSU} onChange={(value) => handleCellEdit(index, 'lowSU', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Completed:</div>
                <EditableCell value={row.completed} onChange={(value) => handleCellEdit(index, 'completed', value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-4 bg-white">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={dataWithTargets}
              margin={{ top: 5, right: 5, bottom: 25, left: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="completed" 
                fill="#3b82f6"
                name="Completed Reviews"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b" }}
                name="Target Reviews"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Completed Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-amber-500"></div>
            <span className="text-xs text-muted-foreground">Target Reviews</span>
          </div>
        </div>
      </Card>
    </div>
  );
};