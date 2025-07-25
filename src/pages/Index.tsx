import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSection } from "@/components/DashboardSection";
import { StatusItemData } from "@/components/StatusItem";
import { StatusType } from "@/components/StatusBadge";
import { Users, Target, BarChart3, FileText, Heart, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState({
    date: "24/07/2025",
    title: "Management Meeting (Weekly)",
    sections: [
      {
        id: "attendees",
        title: "Meeting Attendees",
        icon: <Users className="w-6 h-6 text-blue-600" />,
        items: [
          {
            id: "recruitment",
            title: "Recruitment",
            status: "amber" as StatusType,
            lastReviewed: "23-Jul-25",
            comment: "Recruitment to be paused.",
            details: "Several positions still vacant. Need to review strategy and budget allocation."
          },
          {
            id: "staff-documents",
            title: "Staff Documents", 
            status: "amber" as StatusType,
            lastReviewed: "23-Jul-25",
            comment: "Currently processing 3 starters. There are still several documents outstanding - almost completed for all staff. Employment History - Callista is working on this (2 more staff remaining).",
            details: "Document compliance tracking ongoing. Priority focus on completing outstanding employment history checks."
          }
        ]
      },
      {
        id: "agenda",
        title: "Meeting Agenda",
        icon: <FileText className="w-6 h-6 text-purple-600" />,
        items: [
          {
            id: "training",
            title: "Training (5 Years Expiry) - Atlas / Citiation",
            status: "amber" as StatusType,
            lastReviewed: "23-Jul-25",
            comment: "Several staff members still have not completed mandatory training - by the 31st of July.",
            details: "Training compliance deadline approaching. Need immediate action for staff completion."
          },
          {
            id: "spot-checks",
            title: "Spot Checks (3 Monthly)",
            status: "amber" as StatusType, 
            lastReviewed: "23-Jul-25",
            comment: "3 spot checks are due - Callista to send their names to Sam/Melissa - by 23rd",
            details: "Regular quality assurance spot checks due for completion."
          },
          {
            id: "supervision",
            title: "1 to 1 Supervisions (3 Monthly)",
            status: "green" as StatusType,
            lastReviewed: "23-Jul-25",
            comment: "1 person pending supervision, 1 person pending probation review",
            details: "Supervision schedule mostly on track with minimal outstanding items."
          }
        ]
      },
      {
        id: "strategic",
        title: "Strategic Focus",
        icon: <Target className="w-6 h-6 text-green-600" />,
        items: [
          {
            id: "care-plans",
            title: "Care Plans & Risk Assessment",
            status: "red" as StatusType,
            lastReviewed: "23-Jul-25", 
            comment: "4 service users do not have a care plan in place. Please check the initial visit content to determine if all service users are documented correctly.",
            details: "Critical compliance issue requiring immediate attention for service user safety."
          },
          {
            id: "service-user-docs",
            title: "Service User Documents",
            status: "red" as StatusType,
            lastReviewed: "23-Jul-25",
            comment: "Initial consent to deliver of all service users and documented evidence. No forms when handed goes to Denean 11/07/25",
            details: "Documentation compliance critical for service delivery authorization."
          },
          {
            id: "medication",
            title: "Medication Management",
            status: "green" as StatusType,
            lastReviewed: "23-Jul-25",
            comment: "Up to date - no concerns",
            details: "All medication protocols and documentation current and compliant."
          }
        ]
      },
      {
        id: "review-areas", 
        title: "Key Review Areas",
        icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
        items: [
          {
            id: "audits",
            title: "Audits",
            status: "green" as StatusType,
            lastReviewed: "23-Jul-25",
            comment: "6 completed, progress is ongoing",
            details: "Audit schedule progressing well with good completion rate."
          },
          {
            id: "feedback",
            title: "Feedback (3 Month Check In)",
            status: "green" as StatusType,
            lastReviewed: "23-Jul-25", 
            comment: "number of services users due for feedback, Callista to follow up",
            details: "Regular feedback collection from service users proceeding as scheduled."
          }
        ]
      }
    ]
  });

  const handleStatusChange = (sectionId: string, itemId: string, newStatus: StatusType) => {
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? { ...item, status: newStatus, lastReviewed: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) }
                  : item
              )
            }
          : section
      )
    }));

    toast({
      title: "Status Updated",
      description: `Item status changed to ${newStatus}`,
    });
  };

  const handleCommentChange = (sectionId: string, itemId: string, newComment: string) => {
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? { ...item, comment: newComment, lastReviewed: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) }
                  : item
              )
            }
          : section
      )
    }));

    toast({
      title: "Comment Updated",
      description: "Item comment has been saved",
    });
  };

  const calculateStats = () => {
    const allItems = dashboardData.sections.flatMap(section => section.items);
    return {
      green: allItems.filter(item => item.status === "green").length,
      amber: allItems.filter(item => item.status === "amber").length,
      red: allItems.filter(item => item.status === "red").length,
    };
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader 
          date={dashboardData.date}
          title={dashboardData.title}
          stats={calculateStats()}
        />
        
        {dashboardData.sections.map((section) => (
          <DashboardSection
            key={section.id}
            title={section.title}
            icon={section.icon}
            items={section.items}
            onItemStatusChange={(itemId, status) => handleStatusChange(section.id, itemId, status)}
            onItemCommentChange={(itemId, comment) => handleCommentChange(section.id, itemId, comment)}
          />
        ))}
        
        <div className="clay-card p-6 text-center">
          <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
          <p className="text-muted-foreground">
            Supporting quality care through effective management and oversight
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;