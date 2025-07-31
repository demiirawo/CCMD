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
const calculateSectionStatus = (items: Array<{
  status: StatusType;
}>): StatusType => {
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
    title: "Continuous\nImprovement"
  }
};
export const MeetingStatusSummary = ({
  sections
}: MeetingStatusSummaryProps) => {
  console.log('MeetingStatusSummary: Received sections:', sections);

  // Calculate overall status counts
  const statusCounts = {
    green: 0,
    amber: 0,
    red: 0
  };
  sections.forEach(section => {
    if (section.id !== "meeting-overview") {
      section.items.forEach(item => {
        if (item.status === "green") statusCounts.green++;else if (item.status === "amber") statusCounts.amber++;else if (item.status === "red") statusCounts.red++;
      });
    }
  });
  console.log('MeetingStatusSummary: Status counts:', statusCounts);
  
  return (
    <div className="flex items-center justify-center gap-8 py-4">
      <div className="flex items-center gap-2">
        <StatusBadge status="green" />
        <span className="text-sm font-medium">On Track</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status="amber" />
        <span className="text-sm font-medium">At Risk</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status="red" />
        <span className="text-sm font-medium">Critical</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status="na" />
        <span className="text-sm font-medium">Not Applicable</span>
      </div>
    </div>
  );
};