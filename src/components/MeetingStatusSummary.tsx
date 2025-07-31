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
    <div className="flex items-center gap-8 justify-center p-4 bg-card rounded-lg border">
      <div className="text-center">
        <StatusBadge status="green" />
        <p className="text-xs text-muted-foreground mt-1">On Track</p>
      </div>
      <div className="text-center">
        <StatusBadge status="amber" />
        <p className="text-xs text-muted-foreground mt-1">At Risk</p>
      </div>
      <div className="text-center">
        <StatusBadge status="red" />
        <p className="text-xs text-muted-foreground mt-1">Critical</p>
      </div>
      <div className="text-center">
        <StatusBadge status="na" />
        <p className="text-xs text-muted-foreground mt-1">Not Applicable</p>
      </div>
    </div>
  );
};