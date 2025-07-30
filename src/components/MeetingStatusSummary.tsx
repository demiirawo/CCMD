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

  console.log('MeetingStatusSummary: Status counts:', statusCounts);

  return (
    <div className="flex gap-3 p-3 bg-background rounded-lg border border-border shadow-sm mb-4">
      <div className="flex flex-col items-center justify-center bg-green-50 border border-green-200 rounded px-3 py-2 min-w-[70px]">
        <div className="text-lg font-bold text-green-700">{statusCounts.green}</div>
        <div className="text-xs text-green-600 font-medium">On Track</div>
      </div>
      
      <div className="flex flex-col items-center justify-center bg-yellow-50 border border-yellow-200 rounded px-3 py-2 min-w-[70px]">
        <div className="text-lg font-bold text-yellow-700">{statusCounts.amber}</div>
        <div className="text-xs text-yellow-600 font-medium">Attention</div>
      </div>
      
      <div className="flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded px-3 py-2 min-w-[70px]">
        <div className="text-lg font-bold text-red-700">{statusCounts.red}</div>
        <div className="text-xs text-red-600 font-medium">Critical</div>
      </div>
    </div>
  );
};