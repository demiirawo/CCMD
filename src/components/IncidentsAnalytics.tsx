import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
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
      incidents: 0,
      accidents: 0,
      safeguarding: 0,
      resolved: 0
    });
  }
  return months;
};

const chartConfig = {
  incidents: {
    label: "Incidents",
    color: "hsl(var(--chart-1))"
  },
  accidents: {
    label: "Accidents",
    color: "hsl(var(--chart-2))"
  },
  safeguarding: {
    label: "Safeguarding",
    color: "hsl(var(--chart-3))"
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-4))"
  }
};

interface IncidentsAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const IncidentsAnalytics = ({
  meetingDate,
  meetingId
}: IncidentsAnalyticsProps) => {
  const { companyId } = useCurrentCompany();
  useTheme();
  
  const [monthlyData, setMonthlyData] = useState(generateInitialData(meetingDate));
  
  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId, meetingId]);

  useEffect(() => {
    // Always reload from database when meeting date changes to preserve all data
    if (companyId) {
      loadData();
    }
  }, [meetingDate, companyId, meetingId]);

  const loadData = async () => {
    if (!companyId) return;
    
    console.log('🔍 IncidentsAnalytics: Loading data for company_id:', companyId, 'meetingId:', meetingId);
    console.log('🔍 IncidentsAnalytics: Props received - meetingDate:', meetingDate, 'meetingId:', meetingId);
    
    try {
      // Strategy: Load ALL incidents analytics for this company and consolidate the most recent data
      // This ensures we don't lose data due to meeting ID inconsistencies
      const { data: allData, error } = await supabase
        .from('incidents_analytics')
        .select('id, meeting_id, monthly_data, updated_at')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

      console.log('🔍 IncidentsAnalytics: Found all company data:', allData?.length || 0, 'records');
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading incidents analytics:', error);
        return;
      }

      let consolidatedData = generateInitialData(meetingDate);
      
      if (allData && allData.length > 0) {
        console.log('🔍 IncidentsAnalytics: Consolidating data from', allData.length, 'records');
        
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
                ['incidents', 'accidents', 'safeguarding', 'resolved'].forEach(field => {
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
        
        console.log('🔍 IncidentsAnalytics: Consolidated data:', consolidatedData);
        setMonthlyData(consolidatedData);
        console.log('✅ IncidentsAnalytics: Set consolidated data to state');
      } else {
        console.log('🔍 IncidentsAnalytics: No database data found, trying localStorage backup');
        // Try to load from localStorage backup
        const backupKey = meetingId ? `incidents_backup_${companyId}_${meetingId}` : `incidents_backup_${companyId}`;
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
            console.log('✅ IncidentsAnalytics: Loaded from localStorage backup');
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        } else {
          setMonthlyData(generateInitialData(meetingDate));
        }
      }
    } catch (error) {
      console.error('Error loading incidents analytics:', error);
      // Try to load from localStorage backup
      const backupKey = meetingId ? `incidents_backup_${companyId}_${meetingId}` : `incidents_backup_${companyId}`;
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
    if (!companyId) return;
    
    console.log('🔄 IncidentsAnalytics: Starting save operation', {
      companyId: companyId,
      meetingId,
      dataLength: newData.length,
      timestamp: new Date().toISOString(),
      sampleData: newData.slice(0, 2)
    });
    
    try {
      const dataToSave = {
        company_id: companyId,
        meeting_id: meetingId || null,
        monthly_data: newData,
        updated_at: new Date().toISOString()
      };

      console.log('💾 IncidentsAnalytics: Attempting database save with payload:', dataToSave);

      // First try to update existing record
      const { data: existingData } = await supabase
        .from('incidents_analytics')
        .select('id')
        .eq('company_id', companyId)
        .eq('meeting_id', meetingId || null)
        .maybeSingle();

      let result;
      if (existingData) {
        // Update existing record
        console.log('📝 IncidentsAnalytics: Updating existing record:', existingData.id);
        result = await supabase
          .from('incidents_analytics')
          .update(dataToSave)
          .eq('id', existingData.id)
          .select();
      } else {
        // Insert new record
        console.log('➕ IncidentsAnalytics: Inserting new record');
        result = await supabase
          .from('incidents_analytics')
          .insert(dataToSave)
          .select();
      }

      if (result.error) {
        console.error('❌ IncidentsAnalytics: Database save failed:', result.error);
        throw result.error;
      } else {
        console.log('✅ IncidentsAnalytics: Successfully saved to database:', result.data);
        // Save to localStorage as backup
        const backupKey = meetingId ? `incidents_backup_${companyId}_${meetingId}` : `incidents_backup_${companyId}`;
        localStorage.setItem(backupKey, JSON.stringify(newData));
        console.log('💾 IncidentsAnalytics: Also saved backup to localStorage:', backupKey);
      }
    } catch (error) {
      console.error('❌ IncidentsAnalytics: Exception in saveData:', error);
      // Save to localStorage as fallback
      if (companyId) {
        const backupKey = meetingId ? `incidents_backup_${companyId}_${meetingId}` : `incidents_backup_${companyId}`;
        localStorage.setItem(backupKey, JSON.stringify(newData));
        console.log('💾 IncidentsAnalytics: Exception fallback to localStorage:', backupKey);
      }
    }
  };

  const handleCellEdit = (monthIndex: number, field: 'incidents' | 'accidents' | 'safeguarding' | 'resolved', value: number) => {
    const newData = [...monthlyData];
    newData[monthIndex] = {
      ...newData[monthIndex],
      [field]: value
    };
    setMonthlyData(newData);
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
      setEditValue(value.toString());
    };
    
    const handleCancel = () => {
      setEditing(false);
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
      }} className="w-16 h-8 text-sm bg-stone-50 text-black" autoFocus />;
    }
    return <span className="cursor-pointer hover:bg-accent/50 p-1 rounded text-black" onClick={handleStartEdit}>
        {value}
      </span>;
  };

  const visibleData = monthlyData;

  return <div data-analytics="incidents" className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Incidents Analytics</h4>
        <span className="text-sm text-muted-foreground px-2">
          {visibleData[0]?.month} - {visibleData[visibleData.length - 1]?.month}
        </span>
      </div>
      
      <div className="text-sm text-muted-foreground">Monthly incident tracking and resolution</div>
      
      {/* Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleData.map((row, index) => <div key={index} className="p-3 border rounded-lg bg-white">
            <div className="text-sm font-medium mb-2 bg-primary text-primary-foreground px-3 py-2 rounded-t-lg -mx-3 -mt-3">{row.month}</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Incidents:</div>
                <EditableCell value={row.incidents} onChange={value => handleCellEdit(index, 'incidents', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Accidents:</div>
                <EditableCell value={row.accidents} onChange={value => handleCellEdit(index, 'accidents', value)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Safeguarding:</div>
                <EditableCell value={row.safeguarding} onChange={value => handleCellEdit(index, 'safeguarding', value)} />
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
              <Bar dataKey="incidents" fill="#ef4444" name="Incidents" stackId="incidents" />
              <Bar dataKey="accidents" fill="#f59e0b" name="Accidents" stackId="incidents" />
              <Bar dataKey="safeguarding" fill="#3b82f6" name="Safeguarding" stackId="incidents" />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{
              r: 3,
              fill: "#22c55e"
            }} name="Resolved" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Incidents</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Accidents</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Safeguarding</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 border-b-2 border-green-500"></div>
            <span className="text-xs text-muted-foreground">Resolved</span>
          </div>
        </div>
      </Card>
    </div>;
};
