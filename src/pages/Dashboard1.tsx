import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Attendee } from "@/components/TeamAttendeesDisplay";
import { DashboardSection } from "@/components/DashboardSection";
import { ActionsLog, ActionLogEntry } from "@/components/ActionsLog";
import { KeyDocumentTracker, DocumentData } from "@/components/KeyDocumentTracker";
import { StatusItemData } from "@/components/StatusItem";
import { StatusType } from "@/components/StatusBadge";
import { Users, Target, BarChart3, FileText, Heart, Shield, Calendar, UserCheck, ClipboardList, HeartHandshake, TrendingUp, Save, Download, ChevronDown, ChevronUp, Copy, Home, Loader2 } from "lucide-react";
import { MeetingStatusSummary } from "@/components/MeetingStatusSummary";
import { Button } from "@/components/ui/button";
const Dashboard1 = () => {
  // Static data with no functionality
  const [actionsLog] = useState<ActionLogEntry[]>([{
    id: "sample-1",
    timestamp: new Date().toISOString(),
    itemTitle: "Sample Action Item",
    mentionedAttendee: "John Doe",
    comment: "This is a sample comment",
    action: "Review quarterly reports",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "amber" as const,
    closed: false,
    sourceType: "manual" as const,
    auditTrail: []
  }]);
  const [allSectionsExpanded] = useState<boolean | undefined>(undefined);
  const [keyDocuments] = useState<DocumentData[]>([{
    id: "doc-1",
    name: "Policy Manual",
    owner: "HR Department",
    category: "Policy",
    lastReviewDate: "01/01/2024",
    reviewFrequency: "12 months",
    reviewFrequencyNumber: "12",
    reviewFrequencyPeriod: "months",
    nextReviewDate: "01/01/2025"
  }]);
  const [headerData] = useState({
    date: (() => {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      return now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    })(),
    title: "Management Meeting",
    attendees: [{
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      attended: true
    }, {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      attended: true
    }] as Attendee[],
    purpose: "Monthly review and planning session"
  });
  const [dashboardData] = useState({
    date: "",
    title: "",
    attendees: "",
    purpose: "",
    sections: [{
      id: "safe",
      title: "SAFE",
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      items: [{
        id: "safeguarding",
        title: "Safeguarding",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "No safeguarding concerns identified",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "infection-control",
        title: "Infection Control",
        status: "green" as StatusType,
        lastReviewed: "Yesterday",
        observation: "All IPC measures in place",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "medication-safety",
        title: "Medication Safety",
        status: "amber" as StatusType,
        lastReviewed: "Today",
        observation: "Minor medication storage issues identified",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "effective",
      title: "EFFECTIVE",
      icon: <Target className="w-6 h-6 text-green-600" />,
      items: [{
        id: "care-outcomes",
        title: "Care Outcomes",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "Positive outcomes achieved for all service users",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "evidence-based-care",
        title: "Evidence-Based Care",
        status: "green" as StatusType,
        lastReviewed: "Last week",
        observation: "All care plans based on best practice guidance",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "staff-competency",
        title: "Staff Competency",
        status: "amber" as StatusType,
        lastReviewed: "Yesterday",
        observation: "2 staff members require additional training",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "caring",
      title: "CARING",
      icon: <Heart className="w-6 h-6 text-red-600" />,
      items: [{
        id: "dignity-respect",
        title: "Dignity & Respect",
        status: "green" as StatusType,
        lastReviewed: "Today",
        observation: "High standards of dignity maintained",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "compassionate-care",
        title: "Compassionate Care",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "Positive feedback on staff compassion",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "family-involvement",
        title: "Family Involvement",
        status: "green" as StatusType,
        lastReviewed: "Last week",
        observation: "Regular family engagement maintained",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "responsive",
      title: "RESPONSIVE",
      icon: <Users className="w-6 h-6 text-purple-600" />,
      items: [{
        id: "individual-needs",
        title: "Individual Needs",
        status: "green" as StatusType,
        lastReviewed: "Yesterday",
        observation: "Care plans reflect individual preferences",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "complaints-handling",
        title: "Complaints Handling",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "No complaints received this month",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "access-to-services",
        title: "Access to Services",
        status: "amber" as StatusType,
        lastReviewed: "Today",
        observation: "Some delays in accessing external services",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "well-led",
      title: "WELL LED",
      icon: <UserCheck className="w-6 h-6 text-orange-600" />,
      items: [{
        id: "leadership-vision",
        title: "Leadership & Vision",
        status: "green" as StatusType,
        lastReviewed: "Last week",
        observation: "Clear leadership structure in place",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "governance-systems",
        title: "Governance Systems",
        status: "green" as StatusType,
        lastReviewed: "Yesterday",
        observation: "Robust governance processes implemented",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "continuous-improvement",
        title: "Continuous Improvement",
        status: "amber" as StatusType,
        lastReviewed: "Today",
        observation: "Quality improvement plan in development",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }]
  });

  // Calculate stats from dashboard data
  const stats = dashboardData.sections.reduce((acc, section) => {
    section.items.forEach(item => {
      if (item.status === "green") acc.green++;else if (item.status === "amber") acc.amber++;else if (item.status === "red") acc.red++;
    });
    return acc;
  }, {
    green: 0,
    amber: 0,
    red: 0
  });
  return <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        {/* Static Header */}
        <DashboardHeader date={headerData.date} title={headerData.title} attendees={headerData.attendees} purpose={headerData.purpose} stats={stats} sections={dashboardData.sections} actionsLog={actionsLog} readOnly={true} />

        {/* Meeting Status Summary */}
        <div className="mb-6">
          <MeetingStatusSummary sections={dashboardData.sections} />
        </div>

        {/* Static Action Buttons */}
        <div className="flex gap-4 mb-6">
          
          
          
          <Button disabled variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Reset Actions Log
          </Button>
          <Button disabled variant="outline">
            {allSectionsExpanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
            {allSectionsExpanded ? "Collapse All" : "Expand All"}
          </Button>
        </div>

        {/* Dashboard Sections */}
        <div className="space-y-6">
          {dashboardData.sections.map(section => <DashboardSection key={section.id} title={section.title} icon={section.icon} items={section.items} readOnly={true} />)}
        </div>

        {/* Static Components */}
        <div className="mt-8 space-y-6">
          <ActionsLog actions={actionsLog} readOnly={true} />
          
          <KeyDocumentTracker documents={keyDocuments} readOnly={true} />
        </div>
      </div>
    </div>;
};
export default Dashboard1;