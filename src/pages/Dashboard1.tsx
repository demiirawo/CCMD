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
      id: "meeting-overview",
      title: "Meeting Overview",
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      items: [{
        id: "meeting-date",
        title: "Meeting Date",
        status: "green" as StatusType,
        lastReviewed: "Today",
        observation: "Meeting scheduled for today",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "meeting-attendees",
        title: "Meeting Attendees",
        status: "green" as StatusType,
        lastReviewed: "Today",
        observation: "All key staff attending",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "meeting-purpose",
        title: "Meeting Purpose",
        status: "green" as StatusType,
        lastReviewed: "Today",
        observation: "Review and planning session",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "staff",
      title: "Staff",
      icon: <Users className="w-6 h-6 text-purple-600" />,
      items: [{
        id: "recruitment",
        title: "Resourcing",
        status: "amber" as StatusType,
        lastReviewed: "Last week",
        observation: "Currently recruiting for 2 positions",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "staff-documents",
        title: "Staff Documents",
        status: "green" as StatusType,
        lastReviewed: "Yesterday",
        observation: "All documents up to date",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "training",
        title: "Training",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "Training compliance at 95%",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "spot-checks",
        title: "Spot Checks",
        status: "green" as StatusType,
        lastReviewed: "Yesterday",
        observation: "All spot checks completed",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "staff-supervisions",
        title: "Staff Supervisions",
        status: "amber" as StatusType,
        lastReviewed: "Last week",
        observation: "2 supervisions overdue",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "staff-meetings",
        title: "Staff Meetings",
        status: "green" as StatusType,
        lastReviewed: "Today",
        observation: "Monthly staff meeting scheduled",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "care-planning",
      title: "Care Planning & Delivery",
      icon: <HeartHandshake className="w-6 h-6 text-green-600" />,
      items: [{
        id: "care-plans",
        title: "Care Plans & Risk Assessments",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "All care plans reviewed",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "service-user-docs",
        title: "Service User Documents",
        status: "green" as StatusType,
        lastReviewed: "Yesterday",
        observation: "Documentation complete",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "medication",
        title: "Medication Management",
        status: "green" as StatusType,
        lastReviewed: "Today",
        observation: "No medication errors",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "care-notes",
        title: "Care Notes",
        status: "amber" as StatusType,
        lastReviewed: "Yesterday",
        observation: "Some notes pending review",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "call-monitoring",
        title: "Call Monitoring",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "Call monitoring up to date",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "transportation",
        title: "Transportation",
        status: "green" as StatusType,
        lastReviewed: "Today",
        observation: "All transport arranged",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "safety",
      title: "Safety & Compliance",
      icon: <Shield className="w-6 h-6 text-red-600" />,
      items: [{
        id: "safeguarding",
        title: "Safeguarding",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "No safeguarding concerns",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "incidents",
        title: "Incidents & Accidents",
        status: "amber" as StatusType,
        lastReviewed: "Yesterday",
        observation: "1 minor incident this week",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "health-safety",
        title: "Health & Safety",
        status: "green" as StatusType,
        lastReviewed: "Today",
        observation: "All safety checks complete",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "infection-control",
        title: "Infection Control",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "IPC measures in place",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "mental-capacity",
        title: "Mental Capacity Act",
        status: "green" as StatusType,
        lastReviewed: "Last week",
        observation: "All assessments current",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "dols",
        title: "DoLS",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "No DoLS applications needed",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "continuous-improvement",
      title: "Continuous Improvement",
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
      items: [{
        id: "feedback",
        title: "Service User & Family Feedback",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "Positive feedback received",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "audits",
        title: "Internal Audits",
        status: "amber" as StatusType,
        lastReviewed: "Last month",
        observation: "Audit scheduled for next week",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "action-plans",
        title: "Action Plans",
        status: "green" as StatusType,
        lastReviewed: "Yesterday",
        observation: "Action plans on track",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "complaints",
        title: "Complaints & Compliments",
        status: "green" as StatusType,
        lastReviewed: "This week",
        observation: "No complaints this month",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "cqc-compliance",
        title: "CQC Compliance",
        status: "green" as StatusType,
        lastReviewed: "Today",
        observation: "Fully compliant",
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