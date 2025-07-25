import { AlertTriangle, CheckCircle } from "lucide-react";

interface DashboardHeaderProps {
  date: string;
  title: string;
  attendees: string;
  purpose: string;
  stats: {
    green: number;
    amber: number;
    red: number;
  };
}

export const DashboardHeader = ({ date, title, attendees, purpose, stats }: DashboardHeaderProps) => {
  return (
    <div className="bg-white p-8 mb-8 rounded-xl shadow-sm">
      {/* Meeting Overview Section */}
      <div className="grid grid-cols-2 gap-6 mb-8 pb-6 border-b border-border/20">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Meeting Title</h3>
            <p className="text-lg font-semibold text-foreground">{title}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Meeting Date</h3>
            <p className="text-lg font-semibold text-foreground">{date}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300 h-full">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Meeting Attendees</h3>
            <p className="text-lg font-semibold text-foreground">{attendees}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300 h-full">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Meeting Purpose</h3>
            <p className="text-lg font-semibold text-foreground">{purpose}</p>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="flex gap-4 justify-center">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.green}</div>
              <div className="text-sm text-muted-foreground">On Track</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.amber}</div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-red-600" />
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.red}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};