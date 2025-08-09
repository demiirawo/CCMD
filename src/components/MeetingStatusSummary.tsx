import { StatusBadge, StatusType } from "./StatusBadge";
interface MeetingStatusSummaryProps {
  sections: Array<{
    id: string;
    title: string;
    items: Array<{
      status: StatusType;
    }>;
  }>;
  extraStatuses?: StatusType[]; // Optional extra panel statuses to include in counts (e.g., actions, key reviews)
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
  sections,
  extraStatuses
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
        if (item.status === "green") statusCounts.green++;
        else if (item.status === "amber") statusCounts.amber++;
        else if (item.status === "red") statusCounts.red++;
      });
    }
  });

  // Include extra panel statuses (count all statuses provided)
  if (Array.isArray(extraStatuses)) {
    extraStatuses.forEach((s) => {
      if (s === "green") statusCounts.green++;
      else if (s === "amber") statusCounts.amber++;
      else if (s === "red") statusCounts.red++;
    });
  }
  console.log('MeetingStatusSummary: Status counts:', statusCounts);
  
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2" title="Green - On Track">
        <StatusBadge status="green" />
        <span className="text-sm">{statusCounts.green}</span>
      </div>
      <div className="flex items-center gap-2" title="Amber - At Risk">
        <StatusBadge status="amber" />
        <span className="text-sm">{statusCounts.amber}</span>
      </div>
      <div className="flex items-center gap-2" title="Red - Urgent Attention">
        <StatusBadge status="red" />
        <span className="text-sm">{statusCounts.red}</span>
      </div>
    </div>
  );
};