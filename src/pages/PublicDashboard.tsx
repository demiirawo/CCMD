import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSection } from "@/components/DashboardSection";
import { MeetingSummaryPanel } from "@/components/MeetingSummaryPanel";
import { ActionsLog, ActionLogEntry } from "@/components/ActionsLog";
import { KeyDocumentTracker, DocumentData } from "@/components/KeyDocumentTracker";
import { StatusItemData } from "@/components/StatusItem";
import { StatusType } from "@/components/StatusBadge";
import { Attendee } from "@/components/TeamAttendeesDisplay";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompanyDashboardData {
  id: string;
  company_id: string;
  company_name: string;
  data_content: {
    headerData: {
      date: string;
      title: string;
      attendees: Attendee[];
      purpose: string;
    };
    dashboardData: {
      sections: Array<{
        id: string;
        title: string;
        items: StatusItemData[];
      }>;
    };
    actionsLog: ActionLogEntry[];
    keyDocuments: DocumentData[];
  };
  created_at: string;
  updated_at: string;
}

export const PublicDashboard = () => {
  const { companyId } = useParams();
  const [dashboardData, setDashboardData] = useState<CompanyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPublicDashboard();
  }, [companyId]);

  const loadPublicDashboard = async () => {
    if (!companyId) {
      setError("No company ID provided");
      setLoading(false);
      return;
    }

    try {
      // Get the latest dashboard data for this company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        setError("Company not found");
        setLoading(false);
        return;
      }

      // Get the latest meeting headers
      const { data: headerData, error: headerError } = await supabase
        .from('meeting_headers')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false })
        .limit(1);

      // Get subsection data
      const { data: subsectionData, error: subsectionError } = await supabase
        .from('subsection_data')
        .select('*')
        .eq('company_id', companyId);

      // Get actions log
      const { data: actionsData, error: actionsError } = await supabase
        .from('actions_log')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Get key documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('key_documents')
        .select('*')
        .eq('company_id', companyId);

      if (headerError || subsectionError || actionsError || documentsError) {
        console.error('Error loading dashboard data:', { headerError, subsectionError, actionsError, documentsError });
        setError("Error loading dashboard data");
        setLoading(false);
        return;
      }

      // Transform the data into the expected format
      const transformedData: CompanyDashboardData = {
        id: companyId,
        company_id: companyId,
        company_name: company.name,
        data_content: {
          headerData: headerData?.[0] ? {
            date: new Date(headerData[0].meeting_date).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            }) + ' ' + new Date(headerData[0].meeting_date).toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            }),
            title: headerData[0].title || '',
            attendees: Array.isArray(headerData[0].attendees) ? headerData[0].attendees as unknown as Attendee[] : [],
            purpose: headerData[0].purpose || ''
          } : {
            date: '',
            title: '',
            attendees: [],
            purpose: ''
          },
          dashboardData: {
            sections: [
              {
                id: "staff",
                title: "Staff",
                items: subsectionData?.filter(item => item.section_id === "staff").map(item => ({
                  id: item.item_id,
                  title: item.item_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  status: (item.status as StatusType) || "green",
                  lastReviewed: item.last_reviewed || "",
                  observation: item.observation || "",
                  actions: Array.isArray(item.actions) ? item.actions as unknown as import("@/components/ActionForm").ActionItem[] : [],
                  details: "",
                  metadata: (item.metadata as any) || {}
                })) || []
              },
              {
                id: "care-planning",
                title: "Care Planning & Delivery", 
                items: subsectionData?.filter(item => item.section_id === "care-planning").map(item => ({
                  id: item.item_id,
                  title: item.item_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  status: (item.status as StatusType) || "green",
                  lastReviewed: item.last_reviewed || "",
                  observation: item.observation || "",
                  actions: Array.isArray(item.actions) ? item.actions as unknown as import("@/components/ActionForm").ActionItem[] : [],
                  details: "",
                  metadata: (item.metadata as any) || {}
                })) || []
              },
              {
                id: "safety",
                title: "Safety",
                items: subsectionData?.filter(item => item.section_id === "safety").map(item => ({
                  id: item.item_id,
                  title: item.item_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  status: (item.status as StatusType) || "green",
                  lastReviewed: item.last_reviewed || "",
                  observation: item.observation || "",
                  actions: Array.isArray(item.actions) ? item.actions as unknown as import("@/components/ActionForm").ActionItem[] : [],
                  details: "",
                  metadata: (item.metadata as any) || {}
                })) || []
              },
              {
                id: "continuous-improvement",
                title: "Continuous Improvement",
                items: subsectionData?.filter(item => item.section_id === "continuous-improvement").map(item => ({
                  id: item.item_id,
                  title: item.item_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  status: (item.status as StatusType) || "green",
                  lastReviewed: item.last_reviewed || "",
                  observation: item.observation || "",
                  actions: Array.isArray(item.actions) ? item.actions as unknown as import("@/components/ActionForm").ActionItem[] : [],
                  details: "",
                  metadata: (item.metadata as any) || {}
                })) || []
              }
            ]
          },
          actionsLog: actionsData?.map(action => ({
            id: action.action_id,
            timestamp: action.timestamp,
            itemTitle: action.item_title,
            mentionedAttendee: action.mentioned_attendee,
            comment: action.comment,
            action: action.action_text,
            dueDate: action.due_date,
            status: action.status as "green" | "amber" | "red",
            closed: action.closed,
            closedDate: action.closed_date || undefined,
            sourceType: action.source_type as "manual" | "document",
            sourceId: action.source_id || undefined,
            auditTrail: action.audit_trail as any || []
          })) || [],
          keyDocuments: documentsData?.map(doc => {
            const notesParts = doc.notes ? doc.notes.split(' | ') : ['', '', '', '', ''];
            const [owner = '', category = '', lastReviewDate = '', reviewFrequency = '', updatedAt = ''] = notesParts;
            
            return {
              id: doc.id,
              name: doc.name,
              owner,
              category,
              lastReviewDate,
              reviewFrequency,
              reviewFrequencyNumber: reviewFrequency.split(' ')[0] || '',
              reviewFrequencyPeriod: reviewFrequency.split(' ')[1] || '',
              nextReviewDate: doc.due_date || null,
              updatedAt: updatedAt || undefined
            };
          }) || []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setDashboardData(transformedData);
    } catch (error) {
      console.error('Error loading public dashboard:', error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Alert className="mb-4">
            <AlertDescription>
              {error || "Dashboard not found"}
            </AlertDescription>
          </Alert>
          <Link to="/auth">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {dashboardData.company_name} - Public Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Read-only view</p>
              </div>
            </div>
            <Link to="/auth">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Login to Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          <DashboardHeader 
            date={dashboardData.data_content.headerData.date}
            title={dashboardData.data_content.headerData.title}
            attendees={dashboardData.data_content.headerData.attendees}
            purpose={dashboardData.data_content.headerData.purpose}
            stats={{
              green: dashboardData.data_content.dashboardData.sections.reduce((acc, section) => 
                acc + section.items.filter(item => item.status === 'green').length, 0),
              amber: dashboardData.data_content.dashboardData.sections.reduce((acc, section) => 
                acc + section.items.filter(item => item.status === 'amber').length, 0),
              red: dashboardData.data_content.dashboardData.sections.reduce((acc, section) => 
                acc + section.items.filter(item => item.status === 'red').length, 0)
            }}
            readOnly={true}
          />
          
          <MeetingSummaryPanel 
            purpose={dashboardData.data_content.headerData.purpose}
            readOnly={true}
          />
          
          <ActionsLog
            actions={dashboardData.data_content.actionsLog}
            attendees={dashboardData.data_content.headerData.attendees.map(a => a.name)}
            readOnly={true}
          />
          
          <KeyDocumentTracker 
            documents={dashboardData.data_content.keyDocuments}
            attendees={dashboardData.data_content.headerData.attendees.map(a => a.name)}
            readOnly={true}
          />
          
          {dashboardData.data_content.dashboardData.sections.map(section => (
            <DashboardSection 
              key={section.id} 
              title={section.title} 
              items={section.items}
              attendees={dashboardData.data_content.headerData.attendees.map(a => a.name)}
              readOnly={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};