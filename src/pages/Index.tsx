import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSection } from "@/components/DashboardSection";
import { StatusItemData } from "@/components/StatusItem";
import { StatusType } from "@/components/StatusBadge";
import { Users, Target, BarChart3, FileText, Heart, Shield, Calendar, UserCheck, ClipboardList, HeartHandshake, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const Index = () => {
  const {
    toast
  } = useToast();
  const [dashboardData, setDashboardData] = useState({
    date: "24/07/2025",
    title: "Management Meeting (Weekly)",
    attendees: "Manager, Team Leader, Senior Carer",
    purpose: "Weekly review of care quality and operational matters",
    sections: [{
      id: "meeting-overview",
      title: "Meeting Overview",
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      items: [{
        id: "meeting-date",
        title: "Meeting Date",
        status: "green" as StatusType,
        lastReviewed: "24-Jul-25",
        comment: "24/07/2025",
        details: "Current meeting date"
      }, {
        id: "meeting-attendees",
        title: "Meeting Attendees",
        status: "green" as StatusType,
        lastReviewed: "24-Jul-25",
        comment: "Manager, Team Leader, Senior Carer",
        details: "Key staff members present"
      }, {
        id: "meeting-purpose",
        title: "Meeting Purpose",
        status: "green" as StatusType,
        lastReviewed: "24-Jul-25",
        comment: "Weekly review of care quality and operational matters",
        details: "Meeting objectives and goals"
      }]
    }, {
      id: "staff",
      title: "Staff",
      icon: <Users className="w-6 h-6 text-purple-600" />,
      items: [{
        id: "recruitment",
        title: "Recruitment",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Recruitment to be paused.",
        details: "Several positions still vacant. Need to review strategy and budget allocation."
      }, {
        id: "staff-documents",
        title: "Staff Documents",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Currently processing 3 starters. Employment History - Callista working on 2 remaining staff.",
        details: "Document compliance tracking ongoing. Priority focus on completing outstanding employment history checks."
      }, {
        id: "training",
        title: "Training",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Several staff members still have not completed mandatory training - by the 31st of July.",
        details: "Training compliance deadline approaching. Need immediate action for staff completion."
      }, {
        id: "spot-checks",
        title: "Spot Checks",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "3 spot checks are due - Callista to send their names to Sam/Melissa - by 23rd",
        details: "Regular quality assurance spot checks due for completion."
      }, {
        id: "staff-supervisions",
        title: "Staff Supervisions",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "1 person pending supervision, 1 person pending probation review",
        details: "Supervision schedule mostly on track with minimal outstanding items."
      }, {
        id: "staff-meetings",
        title: "Staff Meetings",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Regular team meetings scheduled and conducted",
        details: "Monthly staff meetings proceeding as planned"
      }]
    }, {
      id: "care-planning",
      title: "Care Planning & Delivery",
      icon: <HeartHandshake className="w-6 h-6 text-green-600" />,
      items: [{
        id: "care-plans",
        title: "Care Plans & Risk Assessments",
        status: "red" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "4 service users do not have a care plan in place. Please check the initial visit content to determine if all service users are documented correctly.",
        details: "Critical compliance issue requiring immediate attention for service user safety."
      }, {
        id: "service-user-docs",
        title: "Service User Documents",
        status: "red" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Initial consent to deliver of all service users and documented evidence. No forms when handed goes to Denean 11/07/25",
        details: "Documentation compliance critical for service delivery authorization."
      }, {
        id: "medication",
        title: "Medication Management",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Up to date - no concerns",
        details: "All medication protocols and documentation current and compliant."
      }, {
        id: "care-notes",
        title: "Care Notes",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Daily care notes being completed consistently",
        details: "Care documentation up to date and compliant"
      }, {
        id: "call-monitoring",
        title: "Call Monitoring",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Call monitoring system functioning well",
        details: "Regular monitoring of care visits and timing"
      }]
    }, {
      id: "safety",
      title: "Safety",
      icon: <Shield className="w-6 h-6 text-red-600" />,
      items: [{
        id: "incidents-accidents",
        title: "Incidents & Accidents",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "No recent incidents reported",
        details: "Incident reporting system functioning well"
      }, {
        id: "safeguarding",
        title: "Safeguarding",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "All safeguarding procedures up to date",
        details: "Safeguarding protocols being followed correctly"
      }, {
        id: "risk-register",
        title: "Risk Register",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Risk register requires quarterly review",
        details: "Some risks need updating and reassessment"
      }, {
        id: "infection-control",
        title: "Infection Control",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Infection control measures in place and effective",
        details: "PPE supplies adequate, procedures being followed"
      }]
    }, {
      id: "continuous-improvement",
      title: "Continuous Improvement",
      icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
      items: [{
        id: "feedback",
        title: "Feedback",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "Number of service users due for feedback, Callista to follow up",
        details: "Regular feedback collection from service users proceeding as scheduled."
      }, {
        id: "audits",
        title: "Audits",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        comment: "6 completed, progress is ongoing",
        details: "Audit schedule progressing well with good completion rate."
      }]
    }]
  });
  const handleStatusChange = (sectionId: string, itemId: string, newStatus: StatusType) => {
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => section.id === sectionId ? {
        ...section,
        items: section.items.map(item => item.id === itemId ? {
          ...item,
          status: newStatus,
          lastReviewed: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
          })
        } : item)
      } : section)
    }));
    toast({
      title: "Status Updated",
      description: `Item status changed to ${newStatus}`
    });
  };
  const handleCommentChange = (sectionId: string, itemId: string, newComment: string) => {
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => section.id === sectionId ? {
        ...section,
        items: section.items.map(item => item.id === itemId ? {
          ...item,
          comment: newComment,
          lastReviewed: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
          })
        } : item)
      } : section)
    }));
    toast({
      title: "Comment Updated",
      description: "Item comment has been saved"
    });
  };
  const calculateStats = () => {
    const allItems = dashboardData.sections.flatMap(section => section.items);
    return {
      green: allItems.filter(item => item.status === "green").length,
      amber: allItems.filter(item => item.status === "amber").length,
      red: allItems.filter(item => item.status === "red").length
    };
  };
  return <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader date={dashboardData.date} title={dashboardData.title} stats={calculateStats()} />
        
        {dashboardData.sections.map(section => <DashboardSection key={section.id} title={section.title} icon={section.icon} items={section.items} onItemStatusChange={(itemId, status) => handleStatusChange(section.id, itemId, status)} onItemCommentChange={(itemId, comment) => handleCommentChange(section.id, itemId, comment)} />)}
        
        
      </div>
    </div>;
};
export default Index;