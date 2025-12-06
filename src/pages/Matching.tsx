import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, User, Users, MapPin, Lightbulb, X, Edit2, Trash2, TrendingUp, BarChart3 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

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
  primaryStaffId?: string;
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
  roleType: "Primary" | "Backup" | "Float";
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
  primaryStaffId: "s1",
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
  primaryStaffId: "s2",
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
  primaryStaffId: undefined,
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
  roleType: "Primary",
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
  roleType: "Primary",
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
  roleType: "Backup",
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
  roleType: "Float",
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
  roleType: "Primary",
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

  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ServiceUser | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

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
    availability: "Full-time",
    roleType: "Primary" as "Primary" | "Backup" | "Float"
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
    const unassignedStaff = staff.filter(s => s.id !== user.primaryStaffId && !user.backupStaffIds.includes(s.id));
    return unassignedStaff.map(s => ({
      staff: s,
      score: calculateMatchScore(user, s)
    })).filter(item => item.score > 30).sort((a, b) => b.score - a.score).slice(0, 3);
  }, [staff, calculateMatchScore]);
  const getStaffById = (id: string) => staff.find(s => s.id === id);
  const assignStaff = (userId: string, staffId: string, type: 'primary' | 'backup') => {
    setServiceUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      if (type === 'primary') {
        return {
          ...user,
          primaryStaffId: staffId
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
          primaryStaffId: undefined
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
      roleType: newStaffForm.roleType,
      status: "Active",
      forecastHours: createDefaultForecast(160)
    };
    setStaff(prev => [...prev, newStaffMember]);
    setNewStaffForm({
      name: "",
      skills: "",
      location: "",
      interests: "",
      availability: "Full-time",
      roleType: "Primary"
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
      primaryStaffId: u.primaryStaffId === id ? undefined : u.primaryStaffId,
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
            <TabsTrigger value="diagram">Visual Diagram</TabsTrigger>
            <TabsTrigger value="utilisation">Utilisation</TabsTrigger>
            <TabsTrigger value="users">Service Users</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          {/* Visual Diagram View */}
          <TabsContent value="diagram" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Service Users Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Service Users
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => setIsAddUserOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {filteredServiceUsers.map(user => <Card key={user.id} className={`cursor-pointer transition-all ${selectedServiceUser?.id === user.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`} onClick={() => setSelectedServiceUser(user)}>
                    <CardContent className="pt-4">
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
                      <div className="flex flex-wrap gap-1 mb-3">
                        {user.supportNeeds.slice(0, 2).map(need => <Badge key={need} variant="secondary" className="text-xs">{need}</Badge>)}
                        {user.supportNeeds.length > 2 && <Badge variant="outline" className="text-xs">+{user.supportNeeds.length - 2}</Badge>}
                      </div>
                      
                      {/* Staff assignments */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Primary:</span>
                          {user.primaryStaffId ? <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer" onClick={e => {
                        e.stopPropagation();
                        unassignStaff(user.id, user.primaryStaffId!, 'primary');
                      }}>
                              {getStaffById(user.primaryStaffId)?.name}
                              <X className="h-3 w-3 ml-1" />
                            </Badge> : <span className="text-xs text-orange-600">Unassigned</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">Backup:</span>
                          {user.backupStaffIds.length > 0 ? user.backupStaffIds.map(sid => <Badge key={sid} variant="outline" className="cursor-pointer" onClick={e => {
                        e.stopPropagation();
                        unassignStaff(user.id, sid, 'backup');
                      }}>
                                {getStaffById(sid)?.name}
                                <X className="h-3 w-3 ml-1" />
                              </Badge>) : <span className="text-xs text-muted-foreground">None</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>

              {/* Connection Diagram (Middle) */}
              <div className="relative min-h-[400px] flex flex-col items-center justify-center">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{
                zIndex: 0
              }}>
                  {filteredServiceUsers.map((user, userIndex) => {
                  const userY = 80 + userIndex * 120;
                  const staffList = staff;
                  return <>
                        {/* Primary staff connection - solid line */}
                        {user.primaryStaffId && <line key={`primary-${user.id}`} x1="0%" y1={userY} x2="100%" y2={80 + staffList.findIndex(s => s.id === user.primaryStaffId) * 80} stroke="hsl(var(--primary))" strokeWidth="2" className="transition-all" />}
                        {/* Backup staff connections - dotted lines */}
                        {user.backupStaffIds.map(backupId => <line key={`backup-${user.id}-${backupId}`} x1="0%" y1={userY} x2="100%" y2={80 + staffList.findIndex(s => s.id === backupId) * 80} stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeDasharray="5,5" className="transition-all" />)}
                      </>;
                })}
                </svg>
                
                <div className="text-center space-y-4 relative z-10">
                  <div className="p-4 bg-card rounded-lg border shadow-sm">
                    <h3 className="font-medium text-sm mb-2">Connection Legend</h3>
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-primary"></div>
                        <span>Primary Staff</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 border-t-2 border-dashed border-muted-foreground"></div>
                        <span>Backup Staff</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedServiceUser && <Card className="text-left">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          Suggested Matches
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {getSuggestedStaff(selectedServiceUser).length > 0 ? <div className="space-y-2">
                            {getSuggestedStaff(selectedServiceUser).map(({
                        staff: s,
                        score
                      }) => <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                                <span>{s.name}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{score}% match</Badge>
                                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => assignStaff(selectedServiceUser.id, s.id, 'primary')}>
                                    Set Primary
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => assignStaff(selectedServiceUser.id, s.id, 'backup')}>
                                    Add Backup
                                  </Button>
                                </div>
                              </div>)}
                          </div> : <p className="text-xs text-muted-foreground">No strong matches found</p>}
                      </CardContent>
                    </Card>}
                </div>
              </div>

              {/* Staff Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Support Staff
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => setIsAddStaffOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {staff.map(s => <Card key={s.id} className={`cursor-pointer transition-all ${selectedStaff?.id === s.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`} onClick={() => setSelectedStaff(s)}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{s.name}</h3>
                        <div className="flex gap-1 items-center">
                          <Badge variant={s.roleType === 'Primary' ? 'default' : s.roleType === 'Backup' ? 'secondary' : 'outline'} className="text-xs">
                            {s.roleType}
                          </Badge>
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
                      <div className="flex flex-wrap gap-1">
                        {s.skills.slice(0, 2).map(skill => <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>)}
                        {s.skills.length > 2 && <Badge variant="outline" className="text-xs">+{s.skills.length - 2}</Badge>}
                      </div>
                    </CardContent>
                  </Card>)}
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
                  Staff Utilisation Forecast (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Forecasted Hours</TableHead>
                      <TableHead className="text-right">Required FTE</TableHead>
                      <TableHead className="text-right">Available Staff Hours</TableHead>
                      <TableHead className="text-right">Available FTE</TableHead>
                      <TableHead>Utilisation Status</TableHead>
                      <TableHead>Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MONTHS.slice(0, 6).map((month, index) => {
                    const forecastedHours = serviceUsers.reduce((sum, u) => sum + (u.forecastHours[month] || 0), 0);
                    const availableHours = staff.filter(s => s.status === "Active").reduce((sum, s) => sum + (s.forecastHours[month] || 0), 0);
                    const requiredFTE = Math.ceil(forecastedHours / 160);
                    const availableFTE = staff.filter(s => s.status === "Active").length;
                    const utilisation = availableHours > 0 ? forecastedHours / availableHours * 100 : 0;
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
                          <TableCell className="text-right">{forecastedHours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{requiredFTE}</TableCell>
                          <TableCell className="text-right">{availableHours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{availableFTE}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Utilisation: {utilisation.toFixed(1)}%</span>
                              <span className="text-muted-foreground">—</span>
                              <Badge className={statusColor}>{statusText}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input placeholder="Add comment..." className="h-8 bg-white text-sm" />
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
                  <User className="h-5 w-5" />
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
                  <Users className="h-5 w-5" />
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
                        <TableHead>Location</TableHead>
                        <TableHead>Primary Staff</TableHead>
                        <TableHead>Backup Staff</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceUsers.map(user => <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.supportNeeds.slice(0, 2).map(need => <Badge key={need} variant="secondary" className="text-xs">{need}</Badge>)}
                              {user.supportNeeds.length > 2 && <Badge variant="outline" className="text-xs">+{user.supportNeeds.length - 2}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{user.location}</TableCell>
                          <TableCell>
                            {user.primaryStaffId ? <Badge className="bg-green-100 text-green-800">{getStaffById(user.primaryStaffId)?.name}</Badge> : <span className="text-orange-600 text-sm">Unassigned</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.backupStaffIds.map(id => <Badge key={id} variant="outline">{getStaffById(id)?.name}</Badge>)}
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
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
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
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role Type</TableHead>
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
                            <Badge variant={s.roleType === 'Primary' ? 'default' : s.roleType === 'Backup' ? 'secondary' : 'outline'}>
                              {s.roleType}
                            </Badge>
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
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Staff Hours Forecast (12 Months)
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
                <div>
                  <Label>Role Type</Label>
                  <Select value={newStaffForm.roleType} onValueChange={v => setNewStaffForm(f => ({
                  ...f,
                  roleType: v as "Primary" | "Backup" | "Float"
                }))}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Primary">Primary</SelectItem>
                      <SelectItem value="Backup">Backup</SelectItem>
                      <SelectItem value="Float">Float</SelectItem>
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