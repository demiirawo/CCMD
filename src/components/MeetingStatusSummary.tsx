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
    title: "Staff"
  },
  "care-planning": {
    title: "Care Planning"
  },
  safety: {
    title: "Safety"
  },
  "continuous-improvement": {
    title: "Continuous Improvement"
  }
};

export const MeetingStatusSummary = ({ sections }: MeetingStatusSummaryProps) => {
  const mainSections = sections.filter(section => 
    section.id !== "meeting-overview" && sectionConfig[section.id as keyof typeof sectionConfig]
  );

  return (
    <div className="flex items-center gap-4">
      {mainSections.map(section => {
        const config = sectionConfig[section.id as keyof typeof sectionConfig];
        if (!config) return null;

        const status = calculateSectionStatus(section.items);

        return (
          <div key={section.id} className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-600 font-medium">{config.title}</span>
            <StatusBadge status={status} />
          </div>
        );
      })}
    </div>
  );
};