import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MapPin, X, Edit2, Trash2, BarChart3, Printer } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { SearchableStaffSelect } from "@/components/SearchableStaffSelect";

// Generate week labels for the next 8 weeks
const getNext8Weeks = () => {
  const weeks: string[] = [];
  const now = new Date();
  // Start from the beginning of the current week (Monday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(startOfWeek.getDate() + (i * 7));
    weeks.push(weekStart.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    }));
  }
  return weeks;
};
const WEEKS = getNext8Weeks();
interface WeeklyForecast {
  [week: string]: number;
}
interface StaffAllocation {
  staffId: string;
  allocatedHours: WeeklyForecast;
}

interface ServiceUser {
  id: string;
  name: string;
  supportNeeds: string[];
  preferences: string[];
  location: string;
  primaryStaffIds: string[];
  backupStaffIds: string[];
  forecastHours: WeeklyForecast;
  staffAllocations: StaffAllocation[];
}
interface Staff {
  id: string;
  name: string;
  skills: string[];
  location: string;
  interests: string[];
  availability: string;
  status: "Active" | "On Leave" | "Inactive";
  forecastHours: WeeklyForecast;
}

// Helper to create default forecast hours
const createDefaultForecast = (baseHours: number = 0): WeeklyForecast => {
  const forecast: WeeklyForecast = {};
  WEEKS.forEach(week => {
    forecast[week] = baseHours;
  });
  return forecast;
};
const INITIAL_SERVICE_USERS: ServiceUser[] = [{
  id: "su1",
  name: "John Smith",
  supportNeeds: ["Autism", "Personal Care", "Community Access"],
  preferences: ["Prefers male staff", "Enjoys gardening", "Likes quiet environments"],
  location: "North London",
  primaryStaffIds: ["s1"],
  backupStaffIds: ["s3"],
  forecastHours: createDefaultForecast(21),
  staffAllocations: [{ staffId: "s1", allocatedHours: createDefaultForecast(21) }]
}, {
  id: "su2",
  name: "Mary Johnson",
  supportNeeds: ["Hoisting", "PEG Feeding", "Dementia Care"],
  preferences: ["Prefers female staff", "Enjoys music", "Likes pets"],
  location: "South London",
  primaryStaffIds: ["s2"],
  backupStaffIds: ["s4"],
  forecastHours: createDefaultForecast(30),
  staffAllocations: [{ staffId: "s2", allocatedHours: createDefaultForecast(30) }]
}, {
  id: "su3",
  name: "David Williams",
  supportNeeds: ["Learning Disability", "Behaviour Support", "Community Access"],
  preferences: ["Enjoys sports", "Likes cooking", "Prefers consistent routines"],
  location: "East London",
  primaryStaffIds: [],
  backupStaffIds: [],
  forecastHours: createDefaultForecast(25),
  staffAllocations: []
}];
const INITIAL_STAFF: Staff[] = [{
  id: "s1",
  name: "Sarah Brown",
  skills: ["Autism Trained", "Personal Care", "Community Support", "Makaton"],
  location: "North London",
  interests: ["Gardening", "Reading", "Nature walks"],
  availability: "Full-time",
  status: "Active",
  forecastHours: createDefaultForecast(40)
}, {
  id: "s2",
  name: "Emma Wilson",
  skills: ["PEG Feeding", "Hoisting", "Dementia Experience", "End of Life Care"],
  location: "South London",
  interests: ["Music", "Animals", "Crafts"],
  availability: "Full-time",
  status: "Active",
  forecastHours: createDefaultForecast(40)
}, {
  id: "s3",
  name: "James Taylor",
  skills: ["Autism Trained", "Behaviour Support", "Personal Care"],
  location: "North London",
  interests: ["Sports", "Gaming", "Gardening"],
  availability: "Part-time",
  status: "Active",
  forecastHours: createDefaultForecast(20)
}, {
  id: "s4",
  name: "Lisa Anderson",
  skills: ["Hoisting", "Personal Care", "Medication Administration"],
  location: "South London",
  interests: ["Music", "Cooking", "Animals"],
  availability: "Full-time",
  status: "Active",
  forecastHours: createDefaultForecast(40)
}, {
  id: "s5",
  name: "Michael Chen",
  skills: ["Learning Disability", "Behaviour Support", "Sports Activities"],
  location: "East London",
  interests: ["Sports", "Cooking", "Outdoor activities"],
  availability: "Full-time",
  status: "Active",
  forecastHours: createDefaultForecast(40)
}];
export const Matching = () => {
  const {
    toast
  } = useToast();
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>(INITIAL_SERVICE_USERS);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [supportTypeFilter, setSupportTypeFilter] = useState<string>("all");
  const [selectedServiceUser, setSelectedServiceUser] = useState<ServiceUser | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<{
    userId: string;
    staffId: string;
    type: 'primary' | 'backup';
  } | null>(null);
  const [compactView, setCompactView] = useState(false);

  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ServiceUser | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Inline editing states
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: 'name' | 'supportNeeds' | 'location';
    type: 'user' | 'staff';
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");



  // Form states
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    supportNeeds: "",
    preferences: "",
    location: ""
  });
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    skills: "",
    location: "",
    interests: "",
    availability: "Full-time"
  });
  const locations = useMemo(() => {
    const allLocations = [...new Set([...serviceUsers.map(u => u.location), ...staff.map(s => s.location)])];
    return allLocations.filter(Boolean);
  }, [serviceUsers, staff]);
  const supportTypes = useMemo(() => {
    const allNeeds = serviceUsers.flatMap(u => u.supportNeeds);
    return [...new Set(allNeeds)];
  }, [serviceUsers]);
  const filteredServiceUsers = useMemo(() => {
    return serviceUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.supportNeeds.some(need => need.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLocation = locationFilter === "all" || user.location === locationFilter;
      const matchesSupportType = supportTypeFilter === "all" || user.supportNeeds.includes(supportTypeFilter);
      return matchesSearch && matchesLocation && matchesSupportType;
    });
  }, [serviceUsers, searchTerm, locationFilter, supportTypeFilter]);

  const calculateMatchScore = useCallback((user: ServiceUser, staffMember: Staff): number => {
    let score = 0;

    // Location match (highest priority)
    if (user.location === staffMember.location) score += 30;

    // Skills matching support needs
    user.supportNeeds.forEach(need => {
      if (staffMember.skills.some(skill => skill.toLowerCase().includes(need.toLowerCase()) || need.toLowerCase().includes(skill.toLowerCase()))) {
        score += 20;
      }
    });

    // Interests matching preferences
    user.preferences.forEach(pref => {
      if (staffMember.interests.some(interest => pref.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(pref.toLowerCase()))) {
        score += 10;
      }
    });
    return Math.min(score, 100);
  }, []);
  const getSuggestedStaff = useCallback((user: ServiceUser) => {
    const unassignedStaff = staff.filter(s => !user.primaryStaffIds.includes(s.id) && !user.backupStaffIds.includes(s.id));
    return unassignedStaff.map(s => ({
      staff: s,
      score: calculateMatchScore(user, s)
    })).filter(item => item.score > 30).sort((a, b) => b.score - a.score).slice(0, 3);
  }, [staff, calculateMatchScore]);

  // Get all staff ranked by match score for dropdowns
  const getRankedStaff = useCallback((user: ServiceUser, excludeIds: string[] = []) => {
    return staff.filter(s => !excludeIds.includes(s.id)).map(s => ({
      staff: s,
      score: calculateMatchScore(user, s)
    })).sort((a, b) => b.score - a.score);
  }, [staff, calculateMatchScore]);
  const getStaffById = (id: string) => staff.find(s => s.id === id);
  const assignStaff = (userId: string, staffId: string, type: 'primary' | 'backup') => {
    setServiceUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      if (type === 'primary') {
        if (user.primaryStaffIds.includes(staffId)) return user;
        // Add staff allocation with default 0 hours for current month
        const newAllocation: StaffAllocation = {
          staffId,
          allocatedHours: createDefaultForecast(0)
        };
        return {
          ...user,
          primaryStaffIds: [...user.primaryStaffIds, staffId],
          staffAllocations: [...user.staffAllocations, newAllocation]
        };
      } else {
        if (user.backupStaffIds.includes(staffId)) return user;
        return {
          ...user,
          backupStaffIds: [...user.backupStaffIds, staffId]
        };
      }
    }));
    toast({
      title: "Staff assigned successfully"
    });
  };

  const updateStaffAllocation = (userId: string, staffId: string, month: string, hours: number) => {
    setServiceUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      const updatedAllocations = user.staffAllocations.map(alloc => {
        if (alloc.staffId !== staffId) return alloc;
        return {
          ...alloc,
          allocatedHours: { ...alloc.allocatedHours, [month]: hours }
        };
      });
      return { ...user, staffAllocations: updatedAllocations };
    }));
  };

  const getStaffAllocation = (user: ServiceUser, staffId: string, month: string): number => {
    const allocation = user.staffAllocations.find(a => a.staffId === staffId);
    return allocation?.allocatedHours[month] || 0;
  };

  const unassignStaff = (userId: string, staffId: string, type: 'primary' | 'backup') => {
    setServiceUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      if (type === 'primary') {
        return {
          ...user,
          primaryStaffIds: user.primaryStaffIds.filter(id => id !== staffId),
          staffAllocations: user.staffAllocations.filter(a => a.staffId !== staffId)
        };
      } else {
        return {
          ...user,
          backupStaffIds: user.backupStaffIds.filter(id => id !== staffId)
        };
      }
    }));
    toast({
      title: "Staff unassigned"
    });
  };
  const handleAddUser = () => {
    if (!newUserForm.name.trim()) {
      toast({
        title: "Please enter a name",
        variant: "destructive"
      });
      return;
    }
    const newUser: ServiceUser = {
      id: `su${Date.now()}`,
      name: newUserForm.name,
      supportNeeds: newUserForm.supportNeeds.split(",").map(s => s.trim()).filter(Boolean),
      preferences: newUserForm.preferences.split(",").map(s => s.trim()).filter(Boolean),
      location: newUserForm.location,
      primaryStaffIds: [],
      backupStaffIds: [],
      forecastHours: createDefaultForecast(0),
      staffAllocations: []
    };
    setServiceUsers(prev => [...prev, newUser]);
    setNewUserForm({
      name: "",
      supportNeeds: "",
      preferences: "",
      location: ""
    });
    setIsAddUserOpen(false);
    toast({
      title: "Service user added"
    });
  };
  const handleAddStaff = () => {
    if (!newStaffForm.name.trim()) {
      toast({
        title: "Please enter a name",
        variant: "destructive"
      });
      return;
    }
    const newStaffMember: Staff = {
      id: `s${Date.now()}`,
      name: newStaffForm.name,
      skills: newStaffForm.skills.split(",").map(s => s.trim()).filter(Boolean),
      location: newStaffForm.location,
      interests: newStaffForm.interests.split(",").map(s => s.trim()).filter(Boolean),
      availability: newStaffForm.availability,
      status: "Active",
      forecastHours: createDefaultForecast(160)
    };
    setStaff(prev => [...prev, newStaffMember]);
    setNewStaffForm({
      name: "",
      skills: "",
      location: "",
      interests: "",
      availability: "Full-time"
    });
    setIsAddStaffOpen(false);
    toast({
      title: "Staff member added"
    });
  };
  const handleDeleteUser = (id: string) => {
    setServiceUsers(prev => prev.filter(u => u.id !== id));
    toast({
      title: "Service user removed"
    });
  };
  const handleDeleteStaff = (id: string) => {
    // Also unassign from any service users
    setServiceUsers(prev => prev.map(u => ({
      ...u,
      primaryStaffIds: u.primaryStaffIds.filter(sid => sid !== id),
      backupStaffIds: u.backupStaffIds.filter(sid => sid !== id)
    })));
    setStaff(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Staff member removed"
    });
  };
  return <div className="min-h-screen bg-background pt-24 pb-8 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
            
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or support need..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={supportTypeFilter} onValueChange={setSupportTypeFilter}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Support Type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Support Types</SelectItem>
                  {supportTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="diagram" className="space-y-6">
          <TabsList>
            <TabsTrigger value="diagram">Matching</TabsTrigger>
            <TabsTrigger value="utilisation">Utilisation</TabsTrigger>
            <TabsTrigger value="users">Service Users</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          {/* Matching View */}
          <TabsContent value="diagram" className="space-y-6">
            {/* Print Button at Top */}
            <div className="flex justify-end print:hidden">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>

            {/* Print Area - includes both Utilisation Forecast and Matching View */}
            <div className="print:p-0" style={{ fontSize: '10px' }}>
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  .print-area, .print-area * { visibility: visible; }
                  .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                  .print-hidden { display: none !important; }
                  @page { size: A4; margin: 10mm; }
                }
              `}</style>
              <div className="print-area space-y-4">
                {/* Staff Utilisation Forecast */}
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4" />
                      Staff Utilisation Forecast (8 Weeks)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs py-1">Week</TableHead>
                          <TableHead className="text-xs py-1 text-right">Required Hours</TableHead>
                          <TableHead className="text-xs py-1 text-right">Allocated Hours</TableHead>
                          <TableHead className="text-xs py-1 text-right">Unallocated Hours</TableHead>
                          <TableHead className="text-xs py-1">Utilisation Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {WEEKS.map((week) => {
                          const requiredHours = serviceUsers.reduce((sum, u) => sum + (u.forecastHours[week] || 0), 0);
                          // Allocated hours = sum of all staff allocations across service users for this week
                          const allocatedHours = serviceUsers.reduce((sum, u) => 
                            sum + u.staffAllocations.reduce((staffSum, alloc) => 
                              staffSum + (alloc.allocatedHours[week] || 0), 0), 0);
                          // Unallocated hours = sum of hours from staff NOT assigned as PRIMARY to any service user
                          const primaryStaffIds = new Set(serviceUsers.flatMap(u => u.primaryStaffIds));
                          const unallocatedHours = staff
                            .filter(s => s.status === "Active" && !primaryStaffIds.has(s.id))
                            .reduce((sum, s) => sum + (s.forecastHours[week] || 0), 0);
                          const totalAvailableHours = allocatedHours + unallocatedHours;
                          const utilisation = totalAvailableHours > 0 ? requiredHours / totalAvailableHours * 100 : 0;
                          let statusColor = "bg-orange-100 text-orange-800";
                          let statusText = "Underused – Moderate staff underutilisation";
                          if (utilisation >= 70 && utilisation <= 100) {
                            statusColor = "bg-green-100 text-green-800";
                            statusText = "Optimal – Staff well utilised";
                          } else if (utilisation > 100) {
                            statusColor = "bg-red-100 text-red-800";
                            statusText = "Overworked – Staff shortage risk";
                          }
                          return (
                            <TableRow key={week}>
                              <TableCell className="font-medium text-xs py-1">{week}</TableCell>
                              <TableCell className="text-right text-xs py-1">{requiredHours.toFixed(1)}</TableCell>
                              <TableCell className="text-right text-xs py-1">{allocatedHours.toFixed(1)}</TableCell>
                              <TableCell className="text-right text-xs py-1">{unallocatedHours.toFixed(1)}</TableCell>
                              <TableCell className="py-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">Utilisation: {utilisation.toFixed(1)}%</span>
                                  <span className="text-muted-foreground">—</span>
                                  <Badge className={`${statusColor} text-xs`}>{statusText}</Badge>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {serviceUsers.length} service users • Sum of forecasted hours shown above
                    </div>
                  </CardContent>
                </Card>

                  
                  {locations.map(location => {
                const locationUsers = serviceUsers.filter(u => u.location === location);
                const locationStaff = staff.filter(s => s.location === location);
                if (locationUsers.length === 0 && locationStaff.length === 0) return null;

                // Helper to get match reasons between user and staff
                const getMatchReasons = (user: ServiceUser, staffMember: Staff): string[] => {
                  const reasons: string[] = [];

                  // Skills matching support needs
                  const matchingSkills = user.supportNeeds.filter(need => staffMember.skills.some(skill => skill.toLowerCase().includes(need.toLowerCase()) || need.toLowerCase().includes(skill.toLowerCase())));
                  if (matchingSkills.length > 0) {
                    reasons.push(`Skills: ${matchingSkills.slice(0, 2).join(', ')}`);
                  }

                  // Interests matching preferences
                  const matchingInterests = user.preferences.filter(pref => staffMember.interests.some(interest => pref.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(pref.toLowerCase())));
                  if (matchingInterests.length > 0) {
                    const interestMatches = staffMember.interests.filter(interest => user.preferences.some(pref => pref.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(pref.toLowerCase())));
                    reasons.push(`Interests: ${interestMatches.slice(0, 2).join(', ')}`);
                  }

                  // Location match
                  if (user.location === staffMember.location) {
                    reasons.push('Same location');
                  }
                  return reasons;
                };
                return <div key={location} className="border rounded-lg p-3 print:border-black print:p-2 bg-primary-foreground">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                          <MapPin className="h-4 w-4 print:h-3 print:w-3" />
                          <h3 className="font-semibold text-sm print:text-xs">{location}</h3>
                          <span className="text-xs text-muted-foreground">
                            ({locationUsers.length} service users, {locationStaff.length} staff)
                          </span>
                        </div>
                        
                        {/* Service User to Staff Allocations */}
                        <div className="space-y-2">
                          {locationUsers.map(user => {
                      const allAssignedStaff = [...user.primaryStaffIds.map(id => ({
                        id,
                        type: 'Primary' as const
                      })), ...user.backupStaffIds.map(id => ({
                        id,
                        type: 'Backup' as const
                      }))];
                      const currentWeek = WEEKS[0]; // Current week for display
                      const userRequiredHours = user.forecastHours[currentWeek] || 0;
                      return <div key={user.id} className="rounded p-2 print:p-1.5 bg-primary-foreground">
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-xs">{user.name}</span>
                                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                                        {userRequiredHours}h required ({currentWeek})
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Needs: {user.supportNeeds.slice(0, 3).join(', ')}
                                      {user.supportNeeds.length > 3 && ` +${user.supportNeeds.length - 3}`}
                                    </div>
                                  </div>
                                </div>
                                
                                {allAssignedStaff.length > 0 ? <div className="mt-1.5 space-y-1">
                                    {allAssignedStaff.map(({
                            id: sid,
                            type
                          }) => {
                            const s = getStaffById(sid);
                            if (!s) return null;
                            // For primary staff, show allocated hours; for backup, show available hours
                            const displayHours = type === 'Primary' 
                              ? getStaffAllocation(user, sid, currentWeek)
                              : (s.forecastHours[currentWeek] || 0);
                            const hoursLabel = type === 'Primary' ? 'allocated' : 'available';

                            // Build narrative matching criteria
                            const buildMatchingNarrative = () => {
                              const parts: string[] = [];
                              const skillMatches = user.supportNeeds.filter(need => s.skills.some(skill => skill.toLowerCase().includes(need.toLowerCase()) || need.toLowerCase().includes(skill.toLowerCase())));
                              const interestMatches = s.interests.filter(interest => user.preferences.some(pref => pref.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(pref.toLowerCase())));
                              if (skillMatches.length > 0) {
                                parts.push(`${s.name.split(' ')[0]} has skills in ${skillMatches.slice(0, 2).join(' and ')}`);
                              }
                              if (interestMatches.length > 0) {
                                parts.push(`shares interests in ${interestMatches.slice(0, 2).join(' and ')}`);
                              }
                              if (user.location === s.location) {
                                parts.push('they are in the same location');
                              }
                              if (parts.length === 0) return null;
                              return parts.join(', and ') + '.';
                            };
                            const narrative = buildMatchingNarrative();
                            return <div key={sid} className={`text-[10px] pl-2 border-l-2 ${type === 'Primary' ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-gray-50'} rounded-r p-1`}>
                                          <div className="flex items-center gap-1">
                                            <span className="font-medium">{s.name}</span>
                                            <span className={`text-[9px] px-1 rounded ${type === 'Primary' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                              {type}
                                            </span>
                                            <span className="text-[9px] bg-purple-100 text-purple-800 px-1 rounded">
                                              {displayHours}h {hoursLabel}
                                            </span>
                                          </div>
                                          {narrative && <div className="text-[9px] text-muted-foreground mt-0.5 italic">
                                              <span className="font-medium not-italic">Matching criteria:</span> {user.name.split(' ')[0]} was matched with {s.name.split(' ')[0]} because {narrative}
                                            </div>}
                                        </div>;
                          })}
                                  </div> : <div className="text-[9px] text-orange-600 mt-1">No staff assigned</div>}
                              </div>;
                    })}
                          {locationUsers.length === 0 && <div className="text-[10px] text-muted-foreground italic">No service users in this location</div>}
                        </div>
                        
                        {/* Unassigned Staff in this location */}
                        {(() => {
                    const unassignedStaff = locationStaff.filter(s => !serviceUsers.some(u => u.primaryStaffIds.includes(s.id) || u.backupStaffIds.includes(s.id)));
                    if (unassignedStaff.length === 0) return null;
                    return <div className="mt-2 pt-2 border-t border-dashed">
                              <div className="text-[10px] font-medium text-muted-foreground mb-1">Unassigned Staff:</div>
                              <div className="flex flex-wrap gap-1">
                                {unassignedStaff.map(s => <span key={s.id} className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                    {s.name}
                                  </span>)}
                              </div>
                            </div>;
                  })()}
                      </div>;
              })}
                </div>
              </div>
          </TabsContent>

          {/* Utilisation Tab */}
          <TabsContent value="utilisation" className="space-y-6">
            {/* Staff Dependency Overview - 6 Month Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Staff Utilisation Forecast (8 Weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead className="text-right">Required Hours</TableHead>
                      <TableHead className="text-right">Allocated Hours</TableHead>
                      <TableHead className="text-right">Unallocated Hours</TableHead>
                      <TableHead>Utilisation Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {WEEKS.map((week, index) => {
                    const requiredHours = serviceUsers.reduce((sum, u) => sum + (u.forecastHours[week] || 0), 0);
                    // Allocated hours = sum of all staff allocations across service users for this week
                    const allocatedHours = serviceUsers.reduce((sum, u) => 
                      sum + u.staffAllocations.reduce((staffSum, alloc) => 
                        staffSum + (alloc.allocatedHours[week] || 0), 0), 0);
                    // Unallocated hours = sum of hours from staff NOT assigned as PRIMARY to any service user
                    const primaryStaffIds = new Set(serviceUsers.flatMap(u => u.primaryStaffIds));
                    const unallocatedHours = staff
                      .filter(s => s.status === "Active" && !primaryStaffIds.has(s.id))
                      .reduce((sum, s) => sum + (s.forecastHours[week] || 0), 0);
                    const totalAvailableHours = allocatedHours + unallocatedHours;
                    const utilisation = totalAvailableHours > 0 ? requiredHours / totalAvailableHours * 100 : 0;
                    let statusColor = "bg-green-100 text-green-800";
                    let statusText = "Optimal – Staff well utilised";
                    if (utilisation < 70) {
                      statusColor = "bg-orange-100 text-orange-800";
                      statusText = "Underused – Moderate staff underutilisation";
                    } else if (utilisation > 100) {
                      statusColor = "bg-red-100 text-red-800";
                      statusText = "Overworked – Staff shortage risk";
                    }
                    return <TableRow key={week}>
                          <TableCell className="font-medium">{week}</TableCell>
                          <TableCell className="text-right">{requiredHours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{allocatedHours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{unallocatedHours.toFixed(1)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Utilisation: {utilisation.toFixed(1)}%</span>
                              <span className="text-muted-foreground">—</span>
                              <Badge className={statusColor}>{statusText}</Badge>
                            </div>
                          </TableCell>
                        </TableRow>;
                  })}
                  </TableBody>
                </Table>
                <div className="mt-4 text-sm text-muted-foreground">
                  {serviceUsers.length} service users • Sum of forecasted hours shown above
                </div>
              </CardContent>
            </Card>

            {/* Service User Needs Summary */}
            <Card>
              
              
            </Card>

            {/* Staff Capability Summary */}
            <Card>
              
              
            </Card>
          </TabsContent>

          {/* Service Users Table */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Service Users</CardTitle>
                <Button onClick={() => setIsAddUserOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Support Needs</TableHead>
                        <TableHead>Interests</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Primary Staff</TableHead>
                        <TableHead>Backup Staff</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceUsers.map(user => <TableRow key={user.id}>
                          <TableCell className="font-medium cursor-pointer hover:bg-muted/50" onDoubleClick={() => {
                        setEditingCell({
                          id: user.id,
                          field: 'name',
                          type: 'user'
                        });
                        setEditValue(user.name);
                      }}>
                            {editingCell?.id === user.id && editingCell?.field === 'name' && editingCell?.type === 'user' ? <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => {
                          setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                            ...u,
                            name: editValue
                          } : u));
                          setEditingCell(null);
                        }} onKeyDown={e => {
                          if (e.key === 'Enter') {
                            setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                              ...u,
                              name: editValue
                            } : u));
                            setEditingCell(null);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }} autoFocus className="h-8 bg-white" /> : user.name}
                          </TableCell>
                          <TableCell className="cursor-pointer hover:bg-muted/50" onDoubleClick={() => {
                        setEditingCell({
                          id: user.id,
                          field: 'supportNeeds',
                          type: 'user'
                        });
                        setEditValue(user.supportNeeds.join(', '));
                      }}>
                            {editingCell?.id === user.id && editingCell?.field === 'supportNeeds' && editingCell?.type === 'user' ? <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => {
                          setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                            ...u,
                            supportNeeds: editValue.split(',').map(s => s.trim()).filter(Boolean)
                          } : u));
                          setEditingCell(null);
                        }} onKeyDown={e => {
                          if (e.key === 'Enter') {
                            setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                              ...u,
                              supportNeeds: editValue.split(',').map(s => s.trim()).filter(Boolean)
                            } : u));
                            setEditingCell(null);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }} autoFocus placeholder="Comma-separated needs..." className="h-8 bg-white min-w-[200px]" /> : <div className="flex flex-wrap gap-1">
                                {user.supportNeeds.slice(0, 2).map(need => <Badge key={need} variant="secondary" className="text-xs">{need}</Badge>)}
                                {user.supportNeeds.length > 2 && <Badge variant="outline" className="text-xs">+{user.supportNeeds.length - 2}</Badge>}
                              </div>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.preferences.slice(0, 2).map(pref => <Badge key={pref} variant="outline" className="text-xs">{pref}</Badge>)}
                              {user.preferences.length > 2 && <Badge variant="outline" className="text-xs">+{user.preferences.length - 2}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingCell?.id === user.id && editingCell?.field === 'location' && editingCell?.type === 'user' ? <div className="flex gap-1">
                                <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => {
                            if (editValue.trim()) {
                              setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                ...u,
                                location: editValue.trim()
                              } : u));
                            }
                            setEditingCell(null);
                          }} onKeyDown={e => {
                            if (e.key === 'Enter' && editValue.trim()) {
                              setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                ...u,
                                location: editValue.trim()
                              } : u));
                              setEditingCell(null);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }} autoFocus placeholder="Enter new location..." className="h-8 bg-white min-w-[150px]" />
                              </div> : <Select value={user.location} onValueChange={value => {
                          if (value === '__add_new__') {
                            setEditingCell({
                              id: user.id,
                              field: 'location',
                              type: 'user'
                            });
                            setEditValue('');
                          } else {
                            setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                              ...u,
                              location: value
                            } : u));
                          }
                        }}>
                                <SelectTrigger className="h-8 bg-white min-w-[130px]">
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-50">
                                  {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                  <SelectItem value="__add_new__" className="text-primary font-medium">
                                    <div className="flex items-center gap-1">
                                      <Plus className="h-3 w-3" />
                                      Add new location
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {user.primaryStaffIds.map(sid => {
                                  const currentWeek = WEEKS[0];
                                  const allocatedHours = getStaffAllocation(user, sid, currentWeek);
                                  return (
                                    <div key={sid} className="flex items-center gap-1 bg-green-100 text-green-800 rounded px-1.5 py-0.5">
                                      <span className="text-xs">{getStaffById(sid)?.name}</span>
                                      <Input
                                        type="number"
                                        value={allocatedHours}
                                        onChange={e => updateStaffAllocation(user.id, sid, currentWeek, parseFloat(e.target.value) || 0)}
                                        className="h-5 w-14 text-xs text-right bg-white px-1"
                                        placeholder="hrs"
                                      />
                                      <span className="text-[10px]">h</span>
                                      <X 
                                        className="h-3 w-3 cursor-pointer hover:text-green-900" 
                                        onClick={() => unassignStaff(user.id, sid, 'primary')}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              <SearchableStaffSelect options={getRankedStaff(user, [...user.primaryStaffIds, ...user.backupStaffIds]).map(({
                            staff: s,
                            score
                          }) => ({
                            id: s.id,
                            name: s.name,
                            score
                          }))} onSelect={value => assignStaff(user.id, value, 'primary')} placeholder={user.primaryStaffIds.length > 0 ? "Add more..." : "Select staff..."} triggerClassName="w-[140px]" className="w-[200px]" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {user.backupStaffIds.map(sid => <Badge key={sid} variant="outline" className="cursor-pointer text-xs hover:bg-muted" onClick={() => unassignStaff(user.id, sid, 'backup')}>
                                    {getStaffById(sid)?.name}
                                    <X className="h-3 w-3 ml-1" />
                                  </Badge>)}
                              </div>
                              <SearchableStaffSelect options={getRankedStaff(user, [...user.primaryStaffIds, ...user.backupStaffIds]).map(({
                            staff: s,
                            score
                          }) => ({
                            id: s.id,
                            name: s.name,
                            score
                          }))} onSelect={value => assignStaff(user.id, value, 'backup')} placeholder={user.backupStaffIds.length > 0 ? "Add more..." : "Select staff..."} triggerClassName="w-[140px]" className="w-[200px]" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Service Users Forecast Hours Table with Staff Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Service User Weekly Allocation (8 Weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background min-w-[200px]">Service User / Staff</TableHead>
                        {WEEKS.map(week => <TableHead key={week} className="text-center min-w-[100px]">{week}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceUsers.map(user => (
                        <>
                          {/* Service User Row - Required Hours */}
                          <TableRow key={user.id} className="bg-blue-50">
                            <TableCell className="font-medium sticky left-0 bg-blue-50">
                              <div className="flex flex-col">
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground">Required Hours</span>
                              </div>
                            </TableCell>
                            {WEEKS.map(week => (
                              <TableCell key={week} className="text-center">
                                <Input 
                                  type="number" 
                                  value={user.forecastHours[week] || 0} 
                                  onChange={e => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                      ...u,
                                      forecastHours: { ...u.forecastHours, [week]: value }
                                    } : u));
                                  }} 
                                  className="h-8 w-16 text-center bg-white" 
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                          
                          {/* Primary Staff Rows - with hours allocation */}
                          {user.primaryStaffIds.map(staffId => {
                            const staffMember = getStaffById(staffId);
                            if (!staffMember) return null;
                            return (
                              <TableRow key={`${user.id}-${staffId}-primary`} className="bg-green-50">
                                <TableCell className="sticky left-0 bg-green-50 pl-6">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-green-200 text-green-800 text-xs">Primary</Badge>
                                    <span className="text-sm">{staffMember.name}</span>
                                    <X 
                                      className="h-3 w-3 cursor-pointer text-red-500 hover:text-red-700" 
                                      onClick={() => unassignStaff(user.id, staffId, 'primary')}
                                    />
                                  </div>
                                </TableCell>
                                {WEEKS.map(week => (
                                  <TableCell key={week} className="text-center">
                                    <Input 
                                      type="number" 
                                      value={getStaffAllocation(user, staffId, week)} 
                                      onChange={e => updateStaffAllocation(user.id, staffId, week, parseFloat(e.target.value) || 0)} 
                                      className="h-8 w-16 text-center bg-white" 
                                    />
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
                          })}
                          
                          {/* Backup Staff Rows - no hours allocation */}
                          {user.backupStaffIds.map(staffId => {
                            const staffMember = getStaffById(staffId);
                            if (!staffMember) return null;
                            return (
                              <TableRow key={`${user.id}-${staffId}-backup`} className="bg-gray-50">
                                <TableCell className="sticky left-0 bg-gray-50 pl-6">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">Backup</Badge>
                                    <span className="text-sm">{staffMember.name}</span>
                                    <X 
                                      className="h-3 w-3 cursor-pointer text-red-500 hover:text-red-700" 
                                      onClick={() => unassignStaff(user.id, staffId, 'backup')}
                                    />
                                  </div>
                                </TableCell>
                                {WEEKS.map(week => (
                                  <TableCell key={week} className="text-center text-xs text-muted-foreground">
                                    {staffMember.forecastHours[week] || 0}h avail
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
                          })}
                          
                          {/* Add Staff Row */}
                          <TableRow key={`${user.id}-add-staff`} className="border-b-2">
                            <TableCell className="sticky left-0 bg-background pl-6" colSpan={WEEKS.length + 1}>
                              <div className="flex gap-2">
                                <SearchableStaffSelect 
                                  options={getRankedStaff(user, [...user.primaryStaffIds, ...user.backupStaffIds]).map(({
                                    staff: s,
                                    score
                                  }) => ({
                                    id: s.id,
                                    name: s.name,
                                    score
                                  }))} 
                                  onSelect={value => assignStaff(user.id, value, 'primary')} 
                                  placeholder="+ Add Primary Staff" 
                                  triggerClassName="w-[160px]" 
                                  className="w-[200px]" 
                                />
                                <SearchableStaffSelect 
                                  options={getRankedStaff(user, [...user.primaryStaffIds, ...user.backupStaffIds]).map(({
                                    staff: s,
                                    score
                                  }) => ({
                                    id: s.id,
                                    name: s.name,
                                    score
                                  }))} 
                                  onSelect={value => assignStaff(user.id, value, 'backup')} 
                                  placeholder="+ Add Backup Staff" 
                                  triggerClassName="w-[160px]" 
                                  className="w-[200px]" 
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Table */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Support Staff</CardTitle>
                <Button onClick={() => setIsAddStaffOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Interests</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map(s => <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {s.skills.slice(0, 2).map(skill => <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>)}
                              {s.skills.length > 2 && <Badge variant="outline" className="text-xs">+{s.skills.length - 2}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {s.interests.slice(0, 2).map(interest => <Badge key={interest} variant="outline" className="text-xs">{interest}</Badge>)}
                              {s.interests.length > 2 && <Badge variant="outline" className="text-xs">+{s.interests.length - 2}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{s.location}</TableCell>
                          <TableCell>
                            <Select value={s.status} onValueChange={(value: "Active" | "On Leave" | "Inactive") => {
                          setStaff(prev => prev.map(staff => staff.id === s.id ? {
                            ...staff,
                            status: value
                          } : staff));
                        }}>
                              <SelectTrigger className="h-8 w-24 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="On Leave">On Leave</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(s.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Staff Forecast Hours Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Available Hours

              </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">Name</TableHead>
                        {WEEKS.map(week => <TableHead key={week} className="text-right min-w-[80px]">{week}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map(s => <TableRow key={s.id}>
                          <TableCell className="font-medium sticky left-0 bg-background">{s.name}</TableCell>
                          {WEEKS.map(week => <TableCell key={week} className="text-right">
                              <Input type="number" value={s.forecastHours[week] || 0} onChange={e => {
                          const value = parseFloat(e.target.value) || 0;
                          setStaff(prev => prev.map(staff => staff.id === s.id ? {
                            ...staff,
                            forecastHours: {
                              ...staff.forecastHours,
                              [week]: value
                            }
                          } : staff));
                        }} className="h-8 w-20 text-right bg-white" />
                            </TableCell>)}
                        </TableRow>)}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell className="sticky left-0 bg-muted/50">Total</TableCell>
                        {WEEKS.map(week => <TableCell key={week} className="text-right">
                            {staff.reduce((sum, s) => sum + (s.forecastHours[week] || 0), 0)}
                          </TableCell>)}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Service User Dialog - rendered at top level for immediate display */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add Service User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input value={newUserForm.name} onChange={e => setNewUserForm(f => ({
                ...f,
                name: e.target.value
              }))} className="bg-white" />
              </div>
              <div>
                <Label>Support Needs (comma separated)</Label>
                <Textarea value={newUserForm.supportNeeds} onChange={e => setNewUserForm(f => ({
                ...f,
                supportNeeds: e.target.value
              }))} placeholder="Autism, Personal Care, Community Access" className="bg-white" />
              </div>
              <div>
                <Label>Preferences (comma separated)</Label>
                <Textarea value={newUserForm.preferences} onChange={e => setNewUserForm(f => ({
                ...f,
                preferences: e.target.value
              }))} placeholder="Prefers male staff, Enjoys gardening" className="bg-white" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={newUserForm.location} onChange={e => setNewUserForm(f => ({
                ...f,
                location: e.target.value
              }))} className="bg-white" />
              </div>
              <Button onClick={handleAddUser} className="w-full">Add Service User</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Staff Dialog - rendered at top level for immediate display */}
        <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input value={newStaffForm.name} onChange={e => setNewStaffForm(f => ({
                ...f,
                name: e.target.value
              }))} className="bg-white" />
              </div>
              <div>
                <Label>Skills & Experience (comma separated)</Label>
                <Textarea value={newStaffForm.skills} onChange={e => setNewStaffForm(f => ({
                ...f,
                skills: e.target.value
              }))} placeholder="Autism Trained, Personal Care, Makaton" className="bg-white" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={newStaffForm.location} onChange={e => setNewStaffForm(f => ({
                ...f,
                location: e.target.value
              }))} className="bg-white" />
              </div>
              <div>
                <Label>Interests (comma separated)</Label>
                <Textarea value={newStaffForm.interests} onChange={e => setNewStaffForm(f => ({
                ...f,
                interests: e.target.value
              }))} placeholder="Gardening, Sports, Music" className="bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Availability</Label>
                  <Select value={newStaffForm.availability} onValueChange={v => setNewStaffForm(f => ({
                  ...f,
                  availability: v
                }))}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddStaff} className="w-full">Add Staff Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};
export default Matching;