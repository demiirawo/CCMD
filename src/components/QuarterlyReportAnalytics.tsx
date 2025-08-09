import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
interface QuarterlyReportAnalyticsProps {
  type: 'feedback' | 'incidents';
  quarter: string;
  year: string;
}
const generateInitialData = (type: 'feedback' | 'incidents', meetingDate?: Date) => {
  const months = [];
  const currentDate = meetingDate || new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    });
    if (type === 'feedback') {
      months.push({
        month: monthName,
        compliments: Math.floor(Math.random() * 5),
        // Add some test data
        complaints: Math.floor(Math.random() * 3),
        suggestions: Math.floor(Math.random() * 2),
        resolved: Math.floor(Math.random() * 4)
      });
    } else {
      months.push({
        month: monthName,
        incidents: Math.floor(Math.random() * 3),
        // Add some test data
        accidents: Math.floor(Math.random() * 2),
        safeguarding: Math.floor(Math.random() * 2),
        resolved: Math.floor(Math.random() * 4)
      });
    }
  }
  return months;
};
const feedbackChartConfig = {
  compliments: {
    label: "Compliments",
    color: "#22c55e"
  },
  complaints: {
    label: "Complaints",
    color: "#ef4444"
  },
  suggestions: {
    label: "Suggestions",
    color: "#3b82f6"
  },
  resolved: {
    label: "Resolved",
    color: "#f59e0b"
  }
};
const incidentsChartConfig = {
  incidents: {
    label: "Incidents",
    color: "#ef4444"
  },
  accidents: {
    label: "Accidents",
    color: "#f59e0b"
  },
  safeguarding: {
    label: "Safeguarding",
    color: "#3b82f6"
  },
  resolved: {
    label: "Resolved",
    color: "#22c55e"
  }
};
export const QuarterlyReportAnalytics: React.FC<QuarterlyReportAnalyticsProps> = ({
  type,
  quarter,
  year
}) => {
  const {
    profile
  } = useAuth();
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // Calculate a representative date for the quarter
  const getQuarterDate = (quarter: string, year: string) => {
    const quarterMap: {
      [key: string]: string;
    } = {
      'Q1': `${year}-03-31`,
      'Q2': `${year}-06-30`,
      'Q3': `${year}-09-30`,
      'Q4': `${year}-12-31`
    };
    return quarterMap[quarter] || `${year}-12-31`;
  };
  const quarterDate = new Date(getQuarterDate(quarter, year));
  useEffect(() => {
    console.log(`🔄 QuarterlyReportAnalytics useEffect triggered for ${type}`);
    loadData();
  }, [profile?.company_id, type, quarter, year]);
  const loadData = async () => {
    if (!profile?.company_id) return;
    console.log(`🔍 QuarterlyReportAnalytics: Loading ${type} data for company:`, profile.company_id);

    try {
      // 1) Find latest DASHBOARD meeting in this quarter/year
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('id, sections, date')
        .eq('company_id', profile.company_id)
        .eq('quarter', quarter)
        .eq('year', parseInt(year))
        .order('date', { ascending: false });

      if (meetingsError) {
        console.error('❌ Error loading meetings for quarter:', meetingsError);
      }

      let latestDashboardMeetingId: string | null = null;
      if (Array.isArray(meetingsData)) {
        const latestDash = meetingsData.find((m: any) => {
          const sections = typeof m.sections === 'string' ? JSON.parse(m.sections) : (m.sections || []);
          const ids = Array.isArray(sections) ? sections.map((s: any) => s.id) : [];
          return ids.includes('meeting-overview') || ids.includes('staff') || ids.includes('care-planning') || ids.includes('safety') || ids.includes('continuous-improvement') || ids.includes('supported-housing');
        });
        latestDashboardMeetingId = latestDash?.id || null;
      }

      // If no dashboard meeting in quarter, do not include chart
      if (!latestDashboardMeetingId) {
        console.log('ℹ️ No dashboard meeting found for this quarter – skipping analytics chart');
        setMonthlyData([]);
        return;
      }

      const table = type === 'feedback' ? 'feedback_analytics' : 'incidents_analytics';
      const { data: byMeeting, error: byMeetingErr } = await supabase
        .from(table)
        .select('monthly_data, updated_at')
        .eq('company_id', profile.company_id)
        .eq('meeting_id', latestDashboardMeetingId)
        .order('updated_at', { ascending: false });

      if (byMeetingErr) {
        console.warn(`⚠️ ${table} meeting-scoped query error:`, byMeetingErr);
        setMonthlyData([]);
        return;
      }

      const arr = (Array.isArray(byMeeting) && byMeeting[0] && Array.isArray((byMeeting[0] as any).monthly_data))
        ? ((byMeeting[0] as any).monthly_data as any[])
        : [];

      const hasAny = Array.isArray(arr) && arr.some((m: any) => {
        if (type === 'feedback') {
          return (m.compliments || 0) + (m.complaints || 0) + (m.suggestions || 0) + (m.resolved || 0) > 0;
        }
        return (m.incidents || 0) + (m.accidents || 0) + (m.safeguarding || 0) + (m.resolved || 0) > 0;
      });

      if (hasAny) {
        console.log(`✅ Using ${table} from latest dashboard meeting`, latestDashboardMeetingId);
        setMonthlyData(arr);
      } else {
        console.log('ℹ️ Latest dashboard meeting analytics are empty – skipping chart');
        setMonthlyData([]);
      }
    } catch (error) {
      console.error(`❌ Exception in ${type} analytics loadData:`, error);
      setMonthlyData([]);
    }
  };
  const chartConfig = type === 'feedback' ? feedbackChartConfig : incidentsChartConfig;
  const chartTitle = type === 'feedback' ? 'Feedback Analytics' : 'Incidents, Accidents & Safeguarding Analytics';
  console.log(`📊 Rendering ${type} chart with data:`, monthlyData);
  console.log(`📊 Chart config:`, chartConfig);

  const hasAnyRender = Array.isArray(monthlyData) && monthlyData.some((m: any) => {
    if (type === 'feedback') {
      return (m.compliments || 0) + (m.complaints || 0) + (m.suggestions || 0) + (m.resolved || 0) > 0;
    }
    return (m.incidents || 0) + (m.accidents || 0) + (m.safeguarding || 0) + (m.resolved || 0) > 0;
  });
  if (!hasAnyRender) return null;

  return <Card className="p-4 bg-white" data-chart-type={type}>
      <div className="flex items-center justify-between mb-4">
        
        <span className="text-sm text-muted-foreground px-2">
          {monthlyData[0]?.month} - {monthlyData[monthlyData.length - 1]?.month}
        </span>
      </div>
      
      <ChartContainer config={chartConfig} className="h-64 w-full" data-chart-container={type}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={monthlyData} margin={{
          top: 5,
          right: 5,
          bottom: 25,
          left: 5
        }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
            <YAxis axisLine={false} tickLine={false} className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            
            {type === 'feedback' ? <>
                <Bar dataKey="compliments" fill="#22c55e" name="Compliments" stackId="feedback" />
                <Bar dataKey="complaints" fill="#ef4444" name="Complaints" stackId="feedback" />
                <Bar dataKey="suggestions" fill="#3b82f6" name="Suggestions" stackId="feedback" />
                <Line type="monotone" dataKey="resolved" stroke="#f59e0b" strokeWidth={2} dot={{
              r: 3,
              fill: "#f59e0b"
            }} name="Resolved" />
              </> : <>
                <Bar dataKey="incidents" fill="#ef4444" name="Incidents" stackId="incidents" />
                <Bar dataKey="accidents" fill="#f59e0b" name="Accidents" stackId="incidents" />
                <Bar dataKey="safeguarding" fill="#3b82f6" name="Safeguarding" stackId="incidents" />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{
              r: 3,
              fill: "#22c55e"
            }} name="Resolved" />
              </>}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
        {type === 'feedback' ? <>
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
          </> : <>
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
          </>}
      </div>
    </Card>;
};