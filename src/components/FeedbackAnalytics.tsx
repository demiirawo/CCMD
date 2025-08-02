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
    const monthName = date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    });
    months.push({
      month: monthName,
      compliments: 0,
      complaints: 0,
      suggestions: 0,
      resolved: 0
    });
  }
  return months;
};
const chartConfig = {
  compliments: {
    label: "Compliments",
    color: "hsl(var(--chart-1))"
  },
  complaints: {
    label: "Complaints",
    color: "hsl(var(--chart-2))"
  },
  suggestions: {
    label: "Suggestions",
    color: "hsl(var(--chart-3))"
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-4))"
  }
};
interface FeedbackAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}
export const FeedbackAnalytics = ({
  meetingDate,
  meetingId
}: FeedbackAnalyticsProps) => {
  const { profile } = useAuth();
  useTheme();
  
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));
  
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id, meetingId]);

  useEffect(() => {
    // Always reload from database when meeting date changes to preserve all data
    if (profile?.company_id) {
      loadData();
    }
  }, [meetingDate, profile?.company_id, meetingId]);

  const loadData = async () => {
    if (!profile?.company_id) return;
    console.log('🔍 FeedbackAnalytics: Loading data for company_id:', profile.company_id, 'meetingId:', meetingId);
    console.log('🔍 FeedbackAnalytics: Props received - meetingDate:', meetingDate, 'meetingId:', meetingId);
    
    try {
      // Strategy: Load ALL feedback analytics for this company and consolidate the most recent data
      // This ensures we don't lose data due to meeting ID inconsistencies
      const { data: allData, error } = await supabase
        .from('feedback_analytics')
        .select('id, meeting_id, monthly_data, updated_at')
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false });

      console.log('🔍 FeedbackAnalytics: Found all company data:', allData?.length || 0, 'records');
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading feedback analytics:', error);
        return;
      }

      let consolidatedData = generateInitialData(meetingDate);
      
      if (allData && allData.length > 0) {
        console.log('🔍 FeedbackAnalytics: Consolidating data from', allData.length, 'records');
        
        // Consolidate data from all records, prioritizing non-zero values and most recent updates
        const dataByMonth: Record<string, any> = {};
        
        // Process all records, starting with newest
        allData.forEach((record, recordIndex) => {
          const recordData = record.monthly_data as any[];
          if (recordData && Array.isArray(recordData)) {
            recordData.forEach(monthData => {
              if (!dataByMonth[monthData.month]) {
                dataByMonth[monthData.month] = { ...monthData };
              } else {
                // Merge data, keeping non-zero values
                ['compliments', 'complaints', 'suggestions', 'resolved'].forEach(field => {
                  if (monthData[field] > 0 || dataByMonth[monthData.month][field] === 0) {
                    dataByMonth[monthData.month][field] = monthData[field];
                  }
                });
              }
            });
          }
        });
        
        // Apply consolidated data to the structure
        consolidatedData = consolidatedData.map(current => {
          const consolidated = dataByMonth[current.month];
          return consolidated || current;
        });
        
        
        setMonthlyData(consolidatedData);
        console.log('✅ FeedbackAnalytics: Set consolidated data to state');
      } else {
        console.log('🔍 FeedbackAnalytics: No database data found, trying localStorage backup');
        // Try to load from localStorage backup
        const backupKey = meetingId ? `feedback_backup_${profile.company_id}_${meetingId}` : `feedback_backup_${profile.company_id}`;
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
            console.log('✅ FeedbackAnalytics: Loaded from localStorage backup');
          } catch (error) {
            console.error('Error loading backup data:', error);
            setMonthlyData(generateInitialData(meetingDate));
          }
        } else {
          setMonthlyData(generateInitialData(meetingDate));
        }
      }
    } catch (error) {
      console.error('Error loading feedback analytics:', error);
      // Try to load from localStorage backup
      const backupKey = meetingId ? `feedback_backup_${profile.company_id}_${meetingId}` : `feedback_backup_${profile.company_id}`;
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
          setMonthlyData(generateInitialData(meetingDate));
        }
      } else {
        setMonthlyData(generateInitialData(meetingDate));
      }
    }
  };

  const saveData = async (newData: any[]) => {
    if (!profile?.company_id) return;
    
    console.log('🔄 FeedbackAnalytics: Starting save operation', {
      companyId: profile.company_id,
      meetingId,
      dataLength: newData.length,
      timestamp: new Date().toISOString(),
      sampleData: newData.slice(0, 2)
    });
    
    try {
      const dataToSave = {
        company_id: profile.company_id,
        meeting_id: meetingId || null,
        monthly_data: newData,
        updated_at: new Date().toISOString()
      };

      console.log('💾 FeedbackAnalytics: Attempting database save with payload:', dataToSave);

      // First try to update existing record
      const { data: existingData } = await supabase
        .from('feedback_analytics')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('meeting_id', meetingId || null)
        .maybeSingle();

      let result;
      if (existingData) {
        // Update existing record
        console.log('📝 FeedbackAnalytics: Updating existing record:', existingData.id);
        result = await supabase
          .from('feedback_analytics')
          .update(dataToSave)
          .eq('id', existingData.id)
          .select();
      } else {
        // Insert new record
        console.log('➕ FeedbackAnalytics: Inserting new record');
        result = await supabase
          .from('feedback_analytics')
          .insert(dataToSave)
          .select();
      }

      if (result.error) {
        console.error('❌ FeedbackAnalytics: Database save failed:', result.error);
        throw result.error;
      } else {
        console.log('✅ FeedbackAnalytics: Successfully saved to database:', result.data);
        // Save to localStorage as backup
        const backupKey = meetingId ? `feedback_backup_${profile.company_id}_${meetingId}` : `feedback_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, JSON.stringify(newData));
        console.log('💾 FeedbackAnalytics: Also saved backup to localStorage:', backupKey);
      }
    } catch (error) {
      console.error('❌ FeedbackAnalytics: Exception in saveData:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        const backupKey = meetingId ? `feedback_backup_${profile.company_id}_${meetingId}` : `feedback_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, JSON.stringify(newData));
        console.log('💾 FeedbackAnalytics: Exception fallback to localStorage:', backupKey);
      }
    }
  };
  const handleCellEdit = (monthIndex: number, field: 'compliments' | 'complaints' | 'suggestions' | 'resolved', value: number) => {
    console.log('🖱️ FeedbackAnalytics: Cell edit triggered', {
      monthIndex,
      field,
      value,
      timestamp: new Date().toISOString()
    });
    
    const newData = [...monthlyData];
    newData[monthIndex] = {
      ...newData[monthIndex],
      [field]: value
    };
    setMonthlyData(newData);
    
    console.log('📊 FeedbackAnalytics: About to save data:', newData[monthIndex]);
    saveData(newData);
  };
  const EditableCell = ({
    value,
    onChange
  }: {
    value: number;
    onChange: (value: number) => void;
  }) => {
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
      return <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={e => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setEditing(false);
      }} className="w-16 h-8 text-sm bg-stone-50 !text-black" autoFocus />;
    }
    return <span className="cursor-pointer hover:bg-accent/50 p-1 rounded text-black" onClick={handleStartEdit}>
        {value}
      </span>;
  };
  const visibleData = monthlyData;

  return <div data-analytics="feedback" className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Feedback Analytics</h4>
        <span className="text-sm text-muted-foreground px-2">
          {visibleData[0]?.month} - {visibleData[visibleData.length - 1]?.month}
        </span>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly feedback tracking and resolution</div>
      
      {/* Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleData.map((row, index) => <div key={index} className="p-3 border rounded-lg bg-white">
            <div className="text-sm font-medium mb-2 bg-primary text-primary-foreground px-3 py-2 rounded-t-lg -mx-3 -mt-3">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Compliments:</div>
                <EditableCell value={row.compliments} onChange={value => handleCellEdit(index, 'compliments', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Complaints:</div>
                <EditableCell value={row.complaints} onChange={value => handleCellEdit(index, 'complaints', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Suggestions:</div>
                <EditableCell value={row.suggestions} onChange={value => handleCellEdit(index, 'suggestions', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Resolved:</div>
                <EditableCell value={row.resolved} onChange={value => handleCellEdit(index, 'resolved', value)} />
              </div>
            </div>
          </div>)}
      </div>

      {/* Chart */}
      <Card className="p-4 bg-white">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visibleData} margin={{
            top: 5,
            right: 5,
            bottom: 25,
            left: 5
          }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="compliments" fill="#22c55e" name="Compliments" stackId="feedback" />
              <Bar dataKey="complaints" fill="#ef4444" name="Complaints" stackId="feedback" />
              <Bar dataKey="suggestions" fill="#3b82f6" name="Suggestions" stackId="feedback" />
              <Line type="monotone" dataKey="resolved" stroke="#f59e0b" strokeWidth={2} dot={{
              r: 3,
              fill: "#f59e0b"
            }} name="Resolved" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Compliments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Complaints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Suggestions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-amber-500"></div>
            <span className="text-xs text-muted-foreground">Resolved</span>
          </div>
        </div>
      </Card>
    </div>;
};