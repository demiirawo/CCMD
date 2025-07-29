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
      medicationRecords: 0,
      incorrectOutcomes: 0
    });
  }
  
  return months;
};

const chartConfig = {
  medicationRecords: {
    label: "Medication Records",
    color: "hsl(var(--chart-1))",
  },
  incorrectOutcomes: {
    label: "Incorrect Outcomes", 
    color: "hsl(var(--chart-2))",
  },
};

interface MedicationAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const MedicationAnalytics = ({ meetingDate, meetingId }: MedicationAnalyticsProps) => {
  const { profile } = useAuth();
  useTheme();
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));
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

  // Load data from company (not per meeting) to ensure persistence
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id]);

  // Always reload from database when meeting date changes to preserve all data
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    } else {
      setMonthlyData(generateInitialData(meetingDate));
    }
  }, [meetingDate, profile?.company_id]);

  const loadData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('medication_analytics')
        .select('monthly_data')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading medication analytics:', error);
        return;
      }

      if (data?.monthly_data) {
        const loadedData = data.monthly_data as any[];
        const currentStructure = generateInitialData(meetingDate);
        
        // Merge loaded data with current structure
        const mergedData = currentStructure.map(current => {
          const existing = loadedData.find(item => item.month === current.month);
          return existing || current;
        });
        
        setMonthlyData(mergedData);
      } else {
        // Try to load from localStorage backup
        const backupKey = `medication_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backupEntries = JSON.parse(backupData) as any[];
            const currentStructure = generateInitialData(meetingDate);
            const mergedData = currentStructure.map(current => {
              const existing = backupEntries.find(item => item.month === current.month);
              return existing || current;
            });
            setMonthlyData(mergedData);
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading medication analytics:', error);
      // Try to load from localStorage backup
      const backupKey = `medication_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backupEntries = JSON.parse(backupData) as any[];
          const currentStructure = generateInitialData(meetingDate);
          const mergedData = currentStructure.map(current => {
            const existing = backupEntries.find(item => item.month === current.month);
            return existing || current;
          });
          setMonthlyData(mergedData);
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };

  const saveData = async (newData: any[]) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('medication_analytics')
        .upsert({
          company_id: profile.company_id,
          monthly_data: newData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (error) {
        console.error('Error saving medication analytics:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        localStorage.setItem(`medication_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving medication analytics:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        localStorage.setItem(`medication_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    }
  };

  const handleCellEdit = (monthIndex: number, field: 'medicationRecords' | 'incorrectOutcomes', value: number) => {
    const newData = [...monthlyData];
    const actualIndex = currentViewStart + monthIndex;
    newData[actualIndex] = { ...newData[actualIndex], [field]: value };
    setMonthlyData(newData);
    saveData(newData);
  };

  const handlePrevious = () => {
    setCurrentViewStart(Math.max(0, currentViewStart - 4));
  };

  const handleNext = () => {
    setCurrentViewStart(Math.min(8, currentViewStart + 4));
  };

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

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Medication Analytics</h4>
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
      
      <div className="text-sm text-muted-foreground">Monthly medication records and error tracking</div>
      
      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {visibleData.map((row, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2 bg-primary text-primary-foreground px-3 py-2 rounded-t-lg -mx-3 -mt-3">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Records:</div>
                <EditableCell value={row.medicationRecords} onChange={(value) => handleCellEdit(index, 'medicationRecords', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Errors:</div>
                <EditableCell value={row.incorrectOutcomes} onChange={(value) => handleCellEdit(index, 'incorrectOutcomes', value)} />
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
              data={visibleData} 
              margin={{ top: 5, right: 5, bottom: 25, left: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="medicationRecords" 
                fill="#3b82f6"
                name="Medication Records"
              />
              <Line 
                type="monotone" 
                dataKey="incorrectOutcomes" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b" }}
                name="Incorrect Outcomes"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Medication Records</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-amber-500"></div>
            <span className="text-xs text-muted-foreground">Incorrect Outcomes</span>
          </div>
        </div>
      </Card>
    </div>
  );
};