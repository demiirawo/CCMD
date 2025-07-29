import React, { useState, useEffect, useCallback } from "react";
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
      completed: 0
    });
  }
  
  return months;
};

const chartConfig = {
  completed: {
    label: "Completed Supervisions",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Monthly Target", 
    color: "hsl(var(--chart-2))",
  },
};

interface SupervisionAnalyticsProps {
  monthlyStaffData?: Array<{month: string, currentStaff: number, probationStaff?: number}>;
  meetingDate?: Date;
  meetingId?: string;
}

export const SupervisionAnalytics = ({ monthlyStaffData = [], meetingDate, meetingId }: SupervisionAnalyticsProps) => {
  const { profile } = useAuth();
  useTheme();
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));
  const [metrics, setMetrics] = useState({
    passedFrequency: 2,
    probationFrequency: 1
  });
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
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

  // Load draft data from localStorage on mount
  useEffect(() => {
    if (profile?.company_id && meetingId) {
      const draftKey = `supervision_draft_${profile.company_id}_${meetingId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.monthlyData) {
            setMonthlyData(draft.monthlyData);
          }
          if (draft.metrics) {
            setMetrics(draft.metrics);
          }
          setHasUnsavedDraft(true);
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    }
  }, [profile?.company_id, meetingId]);

  // Save draft to localStorage
  const saveDraft = useCallback((newMonthlyData?: typeof monthlyData, newMetrics?: typeof metrics) => {
    if (profile?.company_id && meetingId) {
      const draftKey = `supervision_draft_${profile.company_id}_${meetingId}`;
      const draftData = {
        monthlyData: newMonthlyData || monthlyData,
        metrics: newMetrics || metrics
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setHasUnsavedDraft(true);
    }
  }, [profile?.company_id, meetingId, monthlyData, metrics]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (profile?.company_id && meetingId) {
      const draftKey = `supervision_draft_${profile.company_id}_${meetingId}`;
      localStorage.removeItem(draftKey);
      setHasUnsavedDraft(false);
    }
  }, [profile?.company_id, meetingId]);

  // Load data and regenerate months when meeting date or ID changes
  useEffect(() => {
    if (meetingId && profile?.company_id) {
      loadData();
    }
  }, [meetingId, profile?.company_id]);

  // Always reload from database when meeting date changes to preserve all data
  useEffect(() => {
    if (meetingId && profile?.company_id) {
      loadData();
    } else {
      setMonthlyData(generateInitialData(meetingDate));
    }
  }, [meetingDate, meetingId, profile?.company_id]);

  const loadData = async () => {
    if (!meetingId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('supervision_analytics')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (error) {
        console.error('Error loading supervision data:', error);
        return;
      }

      if (data) {
        const savedMetrics = (data.metrics as any) || {};
        setMetrics({
          passedFrequency: savedMetrics.passedFrequency || 12,
          probationFrequency: savedMetrics.probationFrequency || 4
        });
        setMonthlyData((data.monthly_data as any[]) || generateInitialData(meetingDate));
      }
    } catch (error) {
      console.error('Error in loadData:', error);
    }
  };

  const saveData = async (newMetrics?: typeof metrics, newMonthlyData?: typeof monthlyData) => {
    if (!meetingId || !profile?.company_id) return;

    const dataToSave = {
      meeting_id: meetingId,
      company_id: profile.company_id,
      metrics: newMetrics || metrics,
      monthly_data: newMonthlyData || monthlyData
    };

    try {
      const { error } = await supabase
        .from('supervision_analytics')
        .upsert(dataToSave, {
          onConflict: 'meeting_id,company_id'
        });

      if (error) {
        console.error('Error saving supervision data:', error);
      }
    } catch (error) {
      console.error('Error in saveData:', error);
    }
  };

  // Calculate targets based on monthly staff data and frequencies
  const dataWithTargets = visibleData.map((month) => {
    const staffMonth = monthlyStaffData.find(staff => staff.month === month.month);
    const currentStaff = staffMonth?.currentStaff || 0;
    const probationStaff = staffMonth?.probationStaff || 0;
    
    const passedStaff = Math.max(0, currentStaff - probationStaff);
    const passedTarget = Math.ceil(passedStaff / metrics.passedFrequency);
    const probationTarget = probationStaff * metrics.probationFrequency;
    
    return {
      ...month,
      target: passedTarget + probationTarget
    };
  });

  const handlePrevious = () => {
    setCurrentViewStart(Math.max(0, currentViewStart - 4));
  };

  const handleNext = () => {
    setCurrentViewStart(Math.min(8, currentViewStart + 4));
  };

  const handleMetricChange = (field: 'passedFrequency' | 'probationFrequency', value: number) => {
    const newMetrics = { ...metrics, [field]: value };
    setMetrics(newMetrics);
    saveDraft(undefined, newMetrics);
    saveData(newMetrics).then(() => clearDraft());
  };

  const handleCellEdit = (monthIndex: number, value: number) => {
    const newData = [...monthlyData];
    const actualIndex = currentViewStart + monthIndex;
    newData[actualIndex] = { ...newData[actualIndex], completed: value };
    setMonthlyData(newData);
    saveDraft(newData);
    saveData(undefined, newData).then(() => clearDraft());
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
        <h4 className="text-lg font-semibold text-foreground">Supervision Analytics</h4>
        <div className="flex items-center gap-2">
          {hasUnsavedDraft && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              Unsaved draft
            </div>
          )}
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
      
      <div className="text-sm text-muted-foreground">Monthly supervision completion tracking</div>
      
      {/* Frequency Settings */}
      <div className="flex flex-wrap gap-6 p-4 bg-accent/30 rounded-lg">
        <EditableInput 
          label="Passed Staff Frequency" 
          value={metrics.passedFrequency} 
          onChange={(value) => handleMetricChange('passedFrequency', value)} 
        />
        <EditableInput 
          label="Probation Staff Frequency" 
          value={metrics.probationFrequency} 
          onChange={(value) => handleMetricChange('probationFrequency', value)} 
        />
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-4 gap-4">
        {visibleData.map((row, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2 bg-primary text-primary-foreground px-3 py-2 rounded-t-lg -mx-3 -mt-3">{row.month}</div>
            <div className="text-xs text-muted-foreground mb-1">Completed:</div>
            <EditableCell value={row.completed} onChange={(value) => handleCellEdit(index, value)} />
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
                name="Completed Supervisions"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b" }}
                name="Monthly Target"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Completed Supervisions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-amber-500"></div>
            <span className="text-xs text-muted-foreground">Monthly Target</span>
          </div>
        </div>
      </Card>
    </div>
  );
};