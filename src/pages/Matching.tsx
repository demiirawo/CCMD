import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MapPin, Lightbulb, X, Edit2, Trash2, TrendingUp, BarChart3, Printer } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { SearchableStaffSelect } from "@/components/SearchableStaffSelect";

// Generate month names for the next 12 months
const getNext12Months = () => {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(date.toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit'
    }));
  }
  return months;
};
const MONTHS = getNext12Months();
interface MonthlyForecast {
  [month: string]: number;
}
interface ServiceUser {
  id: string;
  name: string;
  supportNeeds: string[];
  preferences: string[];
  location: string;
  primaryStaffIds: string[];
  backupStaffIds: string[];
  forecastHours: MonthlyForecast;
}
interface Staff {
  id: string;
  name: string;
  skills: string[];
  location: string;
  interests: string[];
  availability: string;
  status: "Active" | "On Leave" | "Inactive";
  forecastHours: MonthlyForecast;
}

// Helper to create default forecast hours
const createDefaultForecast = (baseHours: number = 0): MonthlyForecast => {
  const forecast: MonthlyForecast = {};
  MONTHS.forEach(month => {
    forecast[month] = baseHours;
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
  forecastHours: {
    [MONTHS[0]]: 21,
    [MONTHS[1]]: 123,
    [MONTHS[2]]: 34,
    [MONTHS[3]]: 45,
    [MONTHS[4]]: 50,
    [MONTHS[5]]: 55,
    ...createDefaultForecast(40)
  }
}, {
  id: "su2",
  name: "Mary Johnson",
  supportNeeds: ["Hoisting", "PEG Feeding", "Dementia Care"],
  preferences: ["Prefers female staff", "Enjoys music", "Likes pets"],
  location: "South London",
  primaryStaffIds: ["s2"],
  backupStaffIds: ["s4"],
  forecastHours: {
    [MONTHS[0]]: 124,
    [MONTHS[1]]: 3,
    [MONTHS[2]]: 3,
    [MONTHS[3]]: 60,
    [MONTHS[4]]: 65,
    [MONTHS[5]]: 70,
    ...createDefaultForecast(50)
  }
}, {
  id: "su3",
  name: "David Williams",
  supportNeeds: ["Learning Disability", "Behaviour Support", "Community Access"],
  preferences: ["Enjoys sports", "Likes cooking", "Prefers consistent routines"],
  location: "East London",
  primaryStaffIds: [],
  backupStaffIds: [],
  forecastHours: {
    [MONTHS[0]]: 55,
    [MONTHS[1]]: 223,
    [MONTHS[2]]: 21,
    [MONTHS[3]]: 30,
    [MONTHS[4]]: 35,
    [MONTHS[5]]: 40,
    ...createDefaultForecast(35)
  }
}];
const INITIAL_STAFF: Staff[] = [{
  id: "s1",
  name: "Sarah Brown",
  skills: ["Autism Trained", "Personal Care", "Community Support", "Makaton"],
  location: "North London",
  interests: ["Gardening", "Reading", "Nature walks"],
  availability: "Full-time",
  status: "Active",
  forecastHours: {
    [MONTHS[0]]: 200,
    [MONTHS[1]]: 200,
    [MONTHS[2]]: 200,
    [MONTHS[3]]: 180,
    [MONTHS[4]]: 200,
    [MONTHS[5]]: 200,
    ...createDefaultForecast(160)
  }
}, {
  id: "s2",
  name: "Emma Wilson",
  skills: ["PEG Feeding", "Hoisting", "Dementia Experience", "End of Life Care"],
  location: "South London",
  interests: ["Music", "Animals", "Crafts"],
  availability: "Full-time",
  status: "Active",
  forecastHours: {
    [MONTHS[0]]: 10,
    [MONTHS[1]]: 10,
    [MONTHS[2]]: 10,
    [MONTHS[3]]: 160,
    [MONTHS[4]]: 160,
    [MONTHS[5]]: 160,
    ...createDefaultForecast(160)
  }
}, {
  id: "s3",
  name: "James Taylor",
  skills: ["Autism Trained", "Behaviour Support", "Personal Care"],
  location: "North London",
  interests: ["Sports", "Gaming", "Gardening"],
  availability: "Part-time",
  status: "Active",
  forecastHours: {
    [MONTHS[0]]: 50,
    [MONTHS[1]]: 50,
    [MONTHS[2]]: 50,
    [MONTHS[3]]: 80,
    [MONTHS[4]]: 80,
    [MONTHS[5]]: 80,
    ...createDefaultForecast(80)
  }
}, {
  id: "s4",
  name: "Lisa Anderson",
  skills: ["Hoisting", "Personal Care", "Medication Administration"],
  location: "South London",
  interests: ["Music", "Cooking", "Animals"],
  availability: "Full-time",
  status: "Active",
  forecastHours: {
    [MONTHS[0]]: 43,
    [MONTHS[1]]: 43,
    [MONTHS[2]]: 43,
    [MONTHS[3]]: 160,
    [MONTHS[4]]: 160,
    [MONTHS[5]]: 160,
    ...createDefaultForecast(160)
  }
}, {
  id: "s5",
  name: "Michael Chen",
  skills: ["Learning Disability", "Behaviour Support", "Sports Activities"],
  location: "East London",
  interests: ["Sports", "Cooking", "Outdoor activities"],
  availability: "Full-time",
  status: "Active",
  forecastHours: {
    [MONTHS[0]]: 120,
    [MONTHS[1]]: 120,
    [MONTHS[2]]: 120,
    [MONTHS[3]]: 160,
    [MONTHS[4]]: 160,
    [MONTHS[5]]: 160,
    ...createDefaultForecast(160)
  }
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

  // Refs for line drawing
  const containerRef = useRef<HTMLDivElement>(null);
  const userCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const staffCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [linePositions, setLinePositions] = useState<Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: 'primary' | 'backup';
  }>>([]);

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

  // Calculate line positions based on actual DOM elements
  const updateLinePositions = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines: typeof linePositions = [];
    filteredServiceUsers.forEach(user => {
      const userCard = userCardRefs.current.get(user.id);
      if (!userCard) return;
      const userRect = userCard.getBoundingClientRect();
      const userY = userRect.top + userRect.height / 2 - containerRect.top;
      const userX = userRect.right - containerRect.left;

      // Primary staff connections
      user.primaryStaffIds.forEach(primaryId => {
        const staffCard = staffCardRefs.current.get(primaryId);
        if (staffCard) {
          const staffRect = staffCard.getBoundingClientRect();
          const staffY = staffRect.top + staffRect.height / 2 - containerRect.top;
          const staffX = staffRect.left - containerRect.left;
          newLines.push({
            id: `primary-${user.id}-${primaryId}`,
            x1: userX,
            y1: userY,
            x2: staffX,
            y2: staffY,
            type: 'primary'
          });
        }
      });

      // Backup staff connections
      user.backupStaffIds.forEach(backupId => {
        const staffCard = staffCardRefs.current.get(backupId);
        if (staffCard) {
          const staffRect = staffCard.getBoundingClientRect();
          const staffY = staffRect.top + staffRect.height / 2 - containerRect.top;
          const staffX = staffRect.left - containerRect.left;
          newLines.push({
            id: `backup-${user.id}-${backupId}`,
            x1: userX,
            y1: userY,
            x2: staffX,
            y2: staffY,
            type: 'backup'
          });
        }
      });
    });
    setLinePositions(newLines);
  }, [filteredServiceUsers, linePositions]);

  // Update lines when data changes or on resize
  useEffect(() => {
    updateLinePositions();
    const handleResize = () => {
      requestAnimationFrame(updateLinePositions);
    };
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [updateLinePositions, serviceUsers, staff]);

  // Delayed update after render
  useEffect(() => {
    const timer = setTimeout(updateLinePositions, 100);
    return () => clearTimeout(timer);
  }, [filteredServiceUsers, staff, updateLinePositions]);
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
        return {
          ...user,
          primaryStaffIds: [...user.primaryStaffIds, staffId]
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
  const unassignStaff = (userId: string, staffId: string, type: 'primary' | 'backup') => {
    setServiceUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      if (type === 'primary') {
        return {
          ...user,
          primaryStaffIds: user.primaryStaffIds.filter(id => id !== staffId)
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
      forecastHours: createDefaultForecast(0)
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

          {/* Visual Diagram View */}
          <TabsContent value="diagram" className="space-y-6">
            {/* View Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Visual View</span>
                <Switch checked={compactView} onCheckedChange={setCompactView} />
                <span className="text-sm font-medium">Print Friendly</span>
              </div>
              {compactView && <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>}
            </div>

            {compactView ? (/* Compact Print-Friendly View */
          <div className="print:p-0" style={{
            fontSize: '10px'
          }}>
                <style>{`
                  @media print {
                    body * { visibility: hidden; }
                    .compact-print-view, .compact-print-view * { visibility: visible; }
                    .compact-print-view { position: absolute; left: 0; top: 0; width: 100%; }
                    @page { size: A4; margin: 10mm; }
                  }
                `}</style>
                <div className="compact-print-view space-y-4">
                  
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
                      return <div key={user.id} className="rounded p-2 print:p-1.5 bg-primary-foreground">
                                <div className="flex items-start justify-between mb-1">
                                  <div>
                                    <div className="font-medium text-xs">{user.name}</div>
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
                            const matchReasons = getMatchReasons(user, s);

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
              </div>) : <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
              {/* SVG for connection lines - spans the entire grid */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{
              zIndex: 10
            }}>
                {linePositions.map(line => <g key={line.id}>
                    <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#3b82f6" strokeWidth={line.type === 'primary' ? 3 : 2} strokeDasharray={line.type === 'backup' ? '5,5' : undefined} className="transition-all duration-300" />
                    {/* Start circle connector */}
                    <circle cx={line.x1} cy={line.y1} r={6} fill="#3b82f6" className="transition-all duration-300" />
                    {/* End circle connector */}
                    <circle cx={line.x2} cy={line.y2} r={6} fill="#3b82f6" className="transition-all duration-300" />
                  </g>)}
              </svg>

              {/* Service Users Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    Service Users
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => setIsAddUserOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {filteredServiceUsers.map(user => <div key={user.id} ref={el => {
                if (el) userCardRefs.current.set(user.id, el);else userCardRefs.current.delete(user.id);
              }} className="relative pt-10">
                    {/* Profile Avatar Circle */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 z-10">
                      <div className="w-16 h-16 rounded-full bg-primary/10 border-4 border-background shadow-lg flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">{user.name.charAt(0)}</span>
                      </div>
                    </div>
                    
                    <Card className={`cursor-pointer transition-all rounded-3xl overflow-hidden ${selectedServiceUser?.id === user.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`} onClick={() => setSelectedServiceUser(user)}>
                      {/* Header Section with color background */}
                      <div className="pt-8 pb-3 px-4 bg-[#ffbf9f]">
                      </div>
                      
                      {/* Content Section */}
                      <CardContent className="pt-3">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => {
                          e.stopPropagation();
                          handleDeleteUser(user.id);
                        }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          {user.location}
                        </div>
                        {/* Support needs tags - two rows */}
                        <div className="flex flex-wrap gap-1 justify-center mb-3">
                          {user.supportNeeds.slice(0, 6).map(need => <Badge key={need} variant="secondary" className="text-xs">{need}</Badge>)}
                          {user.supportNeeds.length > 6 && <Badge variant="outline" className="text-xs bg-background">+{user.supportNeeds.length - 6}</Badge>}
                        </div>
                      
                      {/* Staff assignments with dropdowns */}
                      <div className="space-y-3 pt-2 border-t" onClick={e => e.stopPropagation()}>
                        {/* Primary Staff Multi-Select */}
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">Primary Staff:</span>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {user.primaryStaffIds.map(sid => <Badge key={sid} className="cursor-pointer text-xs bg-green-100 text-green-800 hover:bg-green-200" onClick={() => unassignStaff(user.id, sid, 'primary')}>
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
                        }))} onSelect={value => assignStaff(user.id, value, 'primary')} placeholder="Add primary staff..." className="w-[200px]" />
                        </div>
                        
                        {/* Backup Staff Multi-Select */}
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">Backup Staff:</span>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {user.backupStaffIds.map(sid => <Badge key={sid} variant="outline" className="cursor-pointer text-xs" onClick={() => unassignStaff(user.id, sid, 'backup')}>
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
                        }))} onSelect={value => assignStaff(user.id, value, 'backup')} placeholder="Add backup staff..." className="w-[200px]" />
                        </div>
                      </div>
                      </CardContent>
                    </Card>
                  </div>)}
              </div>

              {/* Connection Diagram (Middle) */}
              <div className="relative min-h-[400px] flex flex-col items-center justify-center">
                {selectedServiceUser && <Card className="text-left">
                  
                  
                </Card>}
              </div>

              {/* Staff Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    Support Staff
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => setIsAddStaffOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {staff.map(s => <div key={s.id} ref={el => {
                if (el) staffCardRefs.current.set(s.id, el);else staffCardRefs.current.delete(s.id);
              }} className="relative pt-10">
                    {/* Profile Avatar Circle */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 z-10">
                      <div className="w-16 h-16 rounded-full bg-secondary/50 border-4 border-background shadow-lg flex items-center justify-center">
                        <span className="text-xl font-bold text-secondary-foreground">{s.name.charAt(0)}</span>
                      </div>
                    </div>
                    
                    <Card className={`cursor-pointer transition-all rounded-3xl overflow-hidden ${selectedStaff?.id === s.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`} onClick={() => setSelectedStaff(s)}>
                      {/* Header Section with color background */}
                      <div className="pt-8 pb-3 px-4 bg-[#3b0fd9]/30">
                      </div>
                      
                      {/* Content Section */}
                      <CardContent className="pt-3">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{s.name}</h3>
                          <div className="flex gap-1 items-center">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => {
                          e.stopPropagation();
                          handleDeleteStaff(s.id);
                        }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3" />
                          {s.location}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{s.availability}</p>
                        {/* Skills tags - two rows */}
                        <div className="flex flex-wrap gap-1 justify-center">
                          {s.skills.slice(0, 6).map(skill => <Badge key={skill} variant="outline" className="text-xs bg-primary/10">{skill}</Badge>)}
                          {s.skills.length > 6 && <Badge variant="outline" className="text-xs bg-primary/10">+{s.skills.length - 6}</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>)}
              </div>
            </div>}
          </TabsContent>

          {/* Utilisation Tab */}
          <TabsContent value="utilisation" className="space-y-6">
            {/* Staff Dependency Overview - 6 Month Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Staff Utilisation Forecast (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Required Hours</TableHead>
                      <TableHead className="text-right">Allocated Hours</TableHead>
                      <TableHead className="text-right">Unallocated Hours</TableHead>
                      <TableHead>Utilisation Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MONTHS.slice(0, 6).map((month, index) => {
                    const requiredHours = serviceUsers.reduce((sum, u) => sum + (u.forecastHours[month] || 0), 0);
                    const availableHours = staff.filter(s => s.status === "Active").reduce((sum, s) => sum + (s.forecastHours[month] || 0), 0);
                    // Allocated hours = sum of hours from staff assigned to service users
                    const allocatedHours = serviceUsers.reduce((sum, u) => {
                      const assignedStaffIds = [...u.primaryStaffIds, ...u.backupStaffIds];
                      const assignedStaff = staff.filter(s => assignedStaffIds.includes(s.id) && s.status === "Active");
                      return sum + assignedStaff.reduce((staffSum, s) => staffSum + (s.forecastHours[month] || 0), 0);
                    }, 0);
                    const utilisation = availableHours > 0 ? requiredHours / availableHours * 100 : 0;
                    let statusColor = "bg-green-100 text-green-800";
                    let statusText = "Optimal – Staff well utilised";
                    if (utilisation < 70) {
                      statusColor = "bg-orange-100 text-orange-800";
                      statusText = "Underused – Moderate staff underutilisation";
                    } else if (utilisation > 100) {
                      statusColor = "bg-red-100 text-red-800";
                      statusText = "Overworked – Staff shortage risk";
                    }
                    return <TableRow key={month}>
                          <TableCell className="font-medium">{month}</TableCell>
                          <TableCell className="text-right">{requiredHours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{allocatedHours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{availableHours.toFixed(1)}</TableCell>
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  
                  Service User Needs Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">Name</TableHead>
                        {MONTHS.slice(0, 6).map(month => <TableHead key={month} className="text-right min-w-[100px]">{month} Forecast Hours</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceUsers.map(user => <TableRow key={user.id}>
                          <TableCell className="font-medium sticky left-0 bg-background">{user.name}</TableCell>
                          {MONTHS.slice(0, 6).map(month => <TableCell key={month} className="text-right">
                              <Input type="number" value={user.forecastHours[month] || 0} onChange={e => {
                          const value = parseFloat(e.target.value) || 0;
                          setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                            ...u,
                            forecastHours: {
                              ...u.forecastHours,
                              [month]: value
                            }
                          } : u));
                        }} className="h-8 w-20 text-right bg-white" />
                            </TableCell>)}
                        </TableRow>)}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell className="sticky left-0 bg-muted/50">Total</TableCell>
                        {MONTHS.slice(0, 6).map(month => <TableCell key={month} className="text-right">
                            Sum {serviceUsers.reduce((sum, u) => sum + (u.forecastHours[month] || 0), 0)}
                          </TableCell>)}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Staff Capability Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  
                  Staff Capability Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">Employee Name</TableHead>
                        <TableHead>Status</TableHead>
                        {MONTHS.slice(0, 6).map(month => <TableHead key={month} className="text-right min-w-[100px]">{month} Forecast Hours</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map(s => <TableRow key={s.id}>
                          <TableCell className="font-medium sticky left-0 bg-background">{s.name}</TableCell>
                          <TableCell>
                            <Badge className={s.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {s.status}
                            </Badge>
                          </TableCell>
                          {MONTHS.slice(0, 6).map(month => <TableCell key={month} className="text-right">
                              <Input type="number" value={s.forecastHours[month] || 0} onChange={e => {
                          const value = parseFloat(e.target.value) || 0;
                          setStaff(prev => prev.map(staff => staff.id === s.id ? {
                            ...staff,
                            forecastHours: {
                              ...staff.forecastHours,
                              [month]: value
                            }
                          } : staff));
                        }} className="h-8 w-20 text-right bg-white" />
                            </TableCell>)}
                        </TableRow>)}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell className="sticky left-0 bg-muted/50">Total</TableCell>
                        <TableCell></TableCell>
                        {MONTHS.slice(0, 6).map(month => <TableCell key={month} className="text-right">
                            Sum {staff.reduce((sum, s) => sum + (s.forecastHours[month] || 0), 0)}
                          </TableCell>)}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
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
                                {user.primaryStaffIds.map(sid => <Badge key={sid} className="cursor-pointer text-xs bg-green-100 text-green-800 hover:bg-green-200" onClick={() => unassignStaff(user.id, sid, 'primary')}>
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

            {/* Service Users Forecast Hours Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Required Hours<TrendingUp className="h-5 w-5" />
                  Service User Hours Forecast (12 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">Name</TableHead>
                        {MONTHS.map(month => <TableHead key={month} className="text-right min-w-[80px]">{month}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceUsers.map(user => <TableRow key={user.id}>
                          <TableCell className="font-medium sticky left-0 bg-background">{user.name}</TableCell>
                          {MONTHS.map(month => <TableCell key={month} className="text-right">
                              <Input type="number" value={user.forecastHours[month] || 0} onChange={e => {
                          const value = parseFloat(e.target.value) || 0;
                          setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                            ...u,
                            forecastHours: {
                              ...u.forecastHours,
                              [month]: value
                            }
                          } : u));
                        }} className="h-8 w-20 text-right bg-white" />
                            </TableCell>)}
                        </TableRow>)}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell className="sticky left-0 bg-muted/50">Total</TableCell>
                        {MONTHS.map(month => <TableCell key={month} className="text-right">
                            {serviceUsers.reduce((sum, u) => sum + (u.forecastHours[month] || 0), 0)}
                          </TableCell>)}
                      </TableRow>
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
                        {MONTHS.map(month => <TableHead key={month} className="text-right min-w-[80px]">{month}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map(s => <TableRow key={s.id}>
                          <TableCell className="font-medium sticky left-0 bg-background">{s.name}</TableCell>
                          {MONTHS.map(month => <TableCell key={month} className="text-right">
                              <Input type="number" value={s.forecastHours[month] || 0} onChange={e => {
                          const value = parseFloat(e.target.value) || 0;
                          setStaff(prev => prev.map(staff => staff.id === s.id ? {
                            ...staff,
                            forecastHours: {
                              ...staff.forecastHours,
                              [month]: value
                            }
                          } : staff));
                        }} className="h-8 w-20 text-right bg-white" />
                            </TableCell>)}
                        </TableRow>)}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell className="sticky left-0 bg-muted/50">Total</TableCell>
                        {MONTHS.map(month => <TableCell key={month} className="text-right">
                            {staff.reduce((sum, s) => sum + (s.forecastHours[month] || 0), 0)}
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