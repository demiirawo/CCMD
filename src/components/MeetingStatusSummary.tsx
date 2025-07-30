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
  // Calculate overall status counts
  const statusCounts = { green: 0, amber: 0, red: 0 };
  
  sections.forEach(section => {
    if (section.id !== "meeting-overview") {
      section.items.forEach(item => {
        if (item.status === "green") statusCounts.green++;
        else if (item.status === "amber") statusCounts.amber++;
        else if (item.status === "red") statusCounts.red++;
      });
    }
  });

  return (
    <div className="flex gap-4 p-6 bg-background rounded-lg border border-border shadow-sm">
      <div className="flex flex-col items-center justify-center bg-green-50 border border-green-200 rounded-lg px-6 py-4 min-w-[100px]">
        <div className="text-3xl font-bold text-green-700">{statusCounts.green}</div>
        <div className="text-sm text-green-600 font-medium">On Track</div>
      </div>
      
      <div className="flex flex-col items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg px-6 py-4 min-w-[100px]">
        <div className="text-3xl font-bold text-yellow-700">{statusCounts.amber}</div>
        <div className="text-sm text-yellow-600 font-medium">Attention</div>
      </div>
      
      <div className="flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-lg px-6 py-4 min-w-[100px]">
        <div className="text-3xl font-bold text-red-700">{statusCounts.red}</div>
        <div className="text-sm text-red-600 font-medium">Critical</div>
      </div>
    </div>
  );
};