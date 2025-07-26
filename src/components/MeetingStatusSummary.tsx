import { Users, HeartHandshake, Shield, TrendingUp } from "lucide-react";
import { StatusBadge, StatusType } from "./StatusBadge";

interface MeetingStatusSummaryProps {
  sections: Array<{
    id: string;
    title: string;
    items: Array<{
      status: StatusType;
    }>;
  }>;
}

const calculateSectionStatus = (items: Array<{ status: StatusType }>): StatusType => {
  if (items.some(item => item.status === "red")) return "red";
  if (items.some(item => item.status === "amber")) return "amber";
  return "green";
};

const sectionConfig = {
  staff: {
    icon: Users,
    title: "Staff"
  },
  "care-planning": {
    icon: HeartHandshake,
    title: "Care Planning"
  },
  safety: {
    icon: Shield,
    title: "Safety"
  },
  "continuous-improvement": {
    icon: TrendingUp,
    title: "Continuous Improvement"
  }
};

export const MeetingStatusSummary = ({ sections }: MeetingStatusSummaryProps) => {
  const mainSections = sections.filter(section => 
    section.id !== "meeting-overview" && sectionConfig[section.id as keyof typeof sectionConfig]
  );

  return (
    <div className="flex items-center gap-4 mt-2">
      {mainSections.map(section => {
        const config = sectionConfig[section.id as keyof typeof sectionConfig];
        if (!config) return null;

        const status = calculateSectionStatus(section.items);
        const Icon = config.icon;

        return (
          <div key={section.id} className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-gray-500" />
            <StatusBadge status={status} className="text-xs" />
          </div>
        );
      })}
    </div>
  );
};