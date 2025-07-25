import { Calendar, Users, AlertTriangle, CheckCircle } from "lucide-react";

interface DashboardHeaderProps {
  date: string;
  title: string;
  stats: {
    green: number;
    amber: number;
    red: number;
  };
}

export const DashboardHeader = ({ date, title, stats }: DashboardHeaderProps) => {
  return (
    <div className="clay-card p-8 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span className="text-lg">{date}</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="clay-card p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.green}</div>
                <div className="text-sm text-muted-foreground">On Track</div>
              </div>
            </div>
          </div>
          
          <div className="clay-card p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.amber}</div>
                <div className="text-sm text-muted-foreground">At Risk</div>
              </div>
            </div>
          </div>
          
          <div className="clay-card p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-red-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.red}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};