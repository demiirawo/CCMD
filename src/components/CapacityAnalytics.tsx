import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CapacityAnalyticsProps {
  onClose: () => void;
}

const monthlyData = [
  { month: 'Apr 25', serviceUsers: 51, currentStaff: 26, minStaff: 12, idealStaff: 22 },
  { month: 'May 25', serviceUsers: 39, currentStaff: 25, minStaff: 17, idealStaff: 18 },
  { month: 'Jun 25', serviceUsers: 58, currentStaff: 16, minStaff: 14, idealStaff: 24 },
  { month: 'Jul 25', serviceUsers: 52, currentStaff: 13, minStaff: 13, idealStaff: 27 },
  { month: 'Aug 24', serviceUsers: 42, currentStaff: 15, minStaff: 12, idealStaff: 20 },
  { month: 'Sep 24', serviceUsers: 46, currentStaff: 18, minStaff: 14, idealStaff: 22 },
  { month: 'Oct 24', serviceUsers: 54, currentStaff: 20, minStaff: 16, idealStaff: 26 },
  { month: 'Nov 24', serviceUsers: 56, currentStaff: 22, minStaff: 18, idealStaff: 28 },
  { month: 'Dec 24', serviceUsers: 58, currentStaff: 24, minStaff: 20, idealStaff: 30 },
  { month: 'Jan 25', serviceUsers: 52, currentStaff: 19, minStaff: 17, idealStaff: 26 },
  { month: 'Feb 25', serviceUsers: 49, currentStaff: 21, minStaff: 15, idealStaff: 24 },
  { month: 'Mar 25', serviceUsers: 55, currentStaff: 23, minStaff: 19, idealStaff: 28 }
];

const currentMetrics = {
  activeServiceUsers: 52,
  currentStaffingLevel: 13,
  minimumStaffingLevel: 13,
  idealStaffingLevel: 27,
  capacityCoverage: 48.1
};

export const CapacityAnalytics = ({ onClose }: CapacityAnalyticsProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            📊 Capacity Analytics
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Monthly Data Table */}
          <div>
            <h3 className="text-lg font-medium mb-4">Monthly Data (Past 12 Months)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left font-medium">Month</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Service Users</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Current Staff</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Min Staff</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Ideal Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3">{data.month}</td>
                      <td className="border border-gray-300 p-3">{data.serviceUsers}</td>
                      <td className="border border-gray-300 p-3">{data.currentStaff}</td>
                      <td className="border border-gray-300 p-3">{data.minStaff}</td>
                      <td className="border border-gray-300 p-3">{data.idealStaff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Current Metrics Cards */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-purple-100 p-4 rounded-lg text-center">
              <div className="text-sm text-purple-600 mb-1">Active Service Users</div>
              <div className="text-2xl font-bold text-purple-800">{currentMetrics.activeServiceUsers}</div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-sm text-blue-600 mb-1">Current Staffing Level</div>
              <div className="text-2xl font-bold text-blue-800">{currentMetrics.currentStaffingLevel}</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <div className="text-sm text-red-600 mb-1">Minimum Staffing Level</div>
              <div className="text-2xl font-bold text-red-800">{currentMetrics.minimumStaffingLevel}</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-sm text-green-600 mb-1">Ideal Staffing Level</div>
              <div className="text-2xl font-bold text-green-800">{currentMetrics.idealStaffingLevel}</div>
            </div>
            <div className="bg-orange-100 p-4 rounded-lg text-center">
              <div className="text-sm text-orange-600 mb-1">Capacity Coverage</div>
              <div className="text-2xl font-bold text-orange-800">{currentMetrics.capacityCoverage}%</div>
              <div className="text-xs text-orange-600">Insufficient</div>
            </div>
          </div>

          {/* Charts Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Charts</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="ml-1 text-sm">Previous</span>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <span className="mr-1 text-sm">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="serviceUsers" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    name="Service Users"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="currentStaff" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name="Current Staff"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minStaff" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    name="Min Staff"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="idealStaff" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    name="Ideal Staff"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-sm text-gray-600 mt-2">
              Graph 1: Trends Over Past 12 Months
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};