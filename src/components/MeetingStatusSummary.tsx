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
  return (
    <div className="flex gap-6 mb-4 justify-center">
      <div className="flex flex-col items-center gap-2">
        <StatusBadge status="green" />
        <div className="text-xs text-center font-medium text-foreground">
          <div className="font-bold">G</div>
          <div>On Track</div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <StatusBadge status="amber" />
        <div className="text-xs text-center font-medium text-foreground">
          <div className="font-bold">A</div>
          <div>At Risk</div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <StatusBadge status="red" />
        <div className="text-xs text-center font-medium text-foreground">
          <div className="font-bold">R</div>
          <div>Critical</div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <StatusBadge status="na" />
        <div className="text-xs text-center font-medium text-foreground">
          <div className="font-bold">N/A</div>
          <div>Not Applicable</div>
        </div>
      </div>
    </div>
  );
};