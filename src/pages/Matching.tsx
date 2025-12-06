import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, User, Users, MapPin, Lightbulb, X, Edit2, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ServiceUser {
  id: string;
  name: string;
  supportNeeds: string[];
  preferences: string[];
  location: string;
  primaryStaffId?: string;
  backupStaffIds: string[];
}

interface Staff {
  id: string;
  name: string;
  skills: string[];
  location: string;
  interests: string[];
  availability: string;
  roleType: "Primary" | "Backup" | "Float";
}

const INITIAL_SERVICE_USERS: ServiceUser[] = [
  {
    id: "su1",
    name: "John Smith",
    supportNeeds: ["Autism", "Personal Care", "Community Access"],
    preferences: ["Prefers male staff", "Enjoys gardening", "Likes quiet environments"],
    location: "North London",
    primaryStaffId: "s1",
    backupStaffIds: ["s3"]
  },
  {
    id: "su2",
    name: "Mary Johnson",
    supportNeeds: ["Hoisting", "PEG Feeding", "Dementia Care"],
    preferences: ["Prefers female staff", "Enjoys music", "Likes pets"],
    location: "South London",
    primaryStaffId: "s2",
    backupStaffIds: ["s4"]
  },
  {
    id: "su3",
    name: "David Williams",
    supportNeeds: ["Learning Disability", "Behaviour Support", "Community Access"],
    preferences: ["Enjoys sports", "Likes cooking", "Prefers consistent routines"],
    location: "East London",
    primaryStaffId: undefined,
    backupStaffIds: []
  }
];

const INITIAL_STAFF: Staff[] = [
  {
    id: "s1",
    name: "Sarah Brown",
    skills: ["Autism Trained", "Personal Care", "Community Support", "Makaton"],
    location: "North London",
    interests: ["Gardening", "Reading", "Nature walks"],
    availability: "Full-time",
    roleType: "Primary"
  },
  {
    id: "s2",
    name: "Emma Wilson",
    skills: ["PEG Feeding", "Hoisting", "Dementia Experience", "End of Life Care"],
    location: "South London",
    interests: ["Music", "Animals", "Crafts"],
    availability: "Full-time",
    roleType: "Primary"
  },
  {
    id: "s3",
    name: "James Taylor",
    skills: ["Autism Trained", "Behaviour Support", "Personal Care"],
    location: "North London",
    interests: ["Sports", "Gaming", "Gardening"],
    availability: "Part-time",
    roleType: "Backup"
  },
  {
    id: "s4",
    name: "Lisa Anderson",
    skills: ["Hoisting", "Personal Care", "Medication Administration"],
    location: "South London",
    interests: ["Music", "Cooking", "Animals"],
    availability: "Full-time",
    roleType: "Float"
  },
  {
    id: "s5",
    name: "Michael Chen",
    skills: ["Learning Disability", "Behaviour Support", "Sports Activities"],
    location: "East London",
    interests: ["Sports", "Cooking", "Outdoor activities"],
    availability: "Full-time",
    roleType: "Primary"
  }
];

export const Matching = () => {
  const { toast } = useToast();
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>(INITIAL_SERVICE_USERS);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [supportTypeFilter, setSupportTypeFilter] = useState<string>("all");
  const [selectedServiceUser, setSelectedServiceUser] = useState<ServiceUser | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<{ userId: string; staffId: string; type: 'primary' | 'backup' } | null>(null);
  
  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ServiceUser | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  // Form states
  const [newUserForm, setNewUserForm] = useState({ name: "", supportNeeds: "", preferences: "", location: "" });
  const [newStaffForm, setNewStaffForm] = useState({ name: "", skills: "", location: "", interests: "", availability: "Full-time", roleType: "Primary" as "Primary" | "Backup" | "Float" });

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
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.supportNeeds.some(need => need.toLowerCase().includes(searchTerm.toLowerCase()));
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
      if (staffMember.skills.some(skill => 
        skill.toLowerCase().includes(need.toLowerCase()) || 
        need.toLowerCase().includes(skill.toLowerCase())
      )) {
        score += 20;
      }
    });
    
    // Interests matching preferences
    user.preferences.forEach(pref => {
      if (staffMember.interests.some(interest => 
        pref.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(pref.toLowerCase())
      )) {
        score += 10;
      }
    });
    
    return Math.min(score, 100);
  }, []);

  const getSuggestedStaff = useCallback((user: ServiceUser) => {
    const unassignedStaff = staff.filter(s => 
      s.id !== user.primaryStaffId && !user.backupStaffIds.includes(s.id)
    );
    
    return unassignedStaff
      .map(s => ({ staff: s, score: calculateMatchScore(user, s) }))
      .filter(item => item.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [staff, calculateMatchScore]);

  const getStaffById = (id: string) => staff.find(s => s.id === id);

  const assignStaff = (userId: string, staffId: string, type: 'primary' | 'backup') => {
    setServiceUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      if (type === 'primary') {
        return { ...user, primaryStaffId: staffId };
      } else {
        if (user.backupStaffIds.includes(staffId)) return user;
        return { ...user, backupStaffIds: [...user.backupStaffIds, staffId] };
      }
    }));
    toast({ title: "Staff assigned successfully" });
  };

  const unassignStaff = (userId: string, staffId: string, type: 'primary' | 'backup') => {
    setServiceUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      if (type === 'primary') {
        return { ...user, primaryStaffId: undefined };
      } else {
        return { ...user, backupStaffIds: user.backupStaffIds.filter(id => id !== staffId) };
      }
    }));
    toast({ title: "Staff unassigned" });
  };

  const handleAddUser = () => {
    if (!newUserForm.name.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    const newUser: ServiceUser = {
      id: `su${Date.now()}`,
      name: newUserForm.name,
      supportNeeds: newUserForm.supportNeeds.split(",").map(s => s.trim()).filter(Boolean),
      preferences: newUserForm.preferences.split(",").map(s => s.trim()).filter(Boolean),
      location: newUserForm.location,
      backupStaffIds: []
    };
    setServiceUsers(prev => [...prev, newUser]);
    setNewUserForm({ name: "", supportNeeds: "", preferences: "", location: "" });
    setIsAddUserOpen(false);
    toast({ title: "Service user added" });
  };

  const handleAddStaff = () => {
    if (!newStaffForm.name.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    const newStaffMember: Staff = {
      id: `s${Date.now()}`,
      name: newStaffForm.name,
      skills: newStaffForm.skills.split(",").map(s => s.trim()).filter(Boolean),
      location: newStaffForm.location,
      interests: newStaffForm.interests.split(",").map(s => s.trim()).filter(Boolean),
      availability: newStaffForm.availability,
      roleType: newStaffForm.roleType
    };
    setStaff(prev => [...prev, newStaffMember]);
    setNewStaffForm({ name: "", skills: "", location: "", interests: "", availability: "Full-time", roleType: "Primary" });
    setIsAddStaffOpen(false);
    toast({ title: "Staff member added" });
  };

  const handleDeleteUser = (id: string) => {
    setServiceUsers(prev => prev.filter(u => u.id !== id));
    toast({ title: "Service user removed" });
  };

  const handleDeleteStaff = (id: string) => {
    // Also unassign from any service users
    setServiceUsers(prev => prev.map(u => ({
      ...u,
      primaryStaffId: u.primaryStaffId === id ? undefined : u.primaryStaffId,
      backupStaffIds: u.backupStaffIds.filter(sid => sid !== id)
    })));
    setStaff(prev => prev.filter(s => s.id !== id));
    toast({ title: "Staff member removed" });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-8 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Matching</h1>
            <p className="text-muted-foreground">Match service users with compatible support workers</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or support need..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={supportTypeFilter} onValueChange={setSupportTypeFilter}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Support Type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Support Types</SelectItem>
                  {supportTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="diagram" className="space-y-6">
          <TabsList>
            <TabsTrigger value="diagram">Visual Diagram</TabsTrigger>
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
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Add Service User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Name</Label>
                          <Input 
                            value={newUserForm.name} 
                            onChange={(e) => setNewUserForm(f => ({ ...f, name: e.target.value }))}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label>Support Needs (comma separated)</Label>
                          <Textarea 
                            value={newUserForm.supportNeeds} 
                            onChange={(e) => setNewUserForm(f => ({ ...f, supportNeeds: e.target.value }))}
                            placeholder="Autism, Personal Care, Community Access"
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label>Preferences (comma separated)</Label>
                          <Textarea 
                            value={newUserForm.preferences} 
                            onChange={(e) => setNewUserForm(f => ({ ...f, preferences: e.target.value }))}
                            placeholder="Prefers male staff, Enjoys gardening"
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input 
                            value={newUserForm.location} 
                            onChange={(e) => setNewUserForm(f => ({ ...f, location: e.target.value }))}
                            className="bg-white"
                          />
                        </div>
                        <Button onClick={handleAddUser} className="w-full">Add Service User</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {filteredServiceUsers.map(user => (
                  <Card 
                    key={user.id} 
                    className={`cursor-pointer transition-all ${selectedServiceUser?.id === user.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                    onClick={() => setSelectedServiceUser(user)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{user.name}</h3>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        {user.location}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {user.supportNeeds.slice(0, 2).map(need => (
                          <Badge key={need} variant="secondary" className="text-xs">{need}</Badge>
                        ))}
                        {user.supportNeeds.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{user.supportNeeds.length - 2}</Badge>
                        )}
                      </div>
                      
                      {/* Staff assignments */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Primary:</span>
                          {user.primaryStaffId ? (
                            <Badge 
                              className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); unassignStaff(user.id, user.primaryStaffId!, 'primary'); }}
                            >
                              {getStaffById(user.primaryStaffId)?.name}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ) : (
                            <span className="text-xs text-orange-600">Unassigned</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">Backup:</span>
                          {user.backupStaffIds.length > 0 ? (
                            user.backupStaffIds.map(sid => (
                              <Badge 
                                key={sid}
                                variant="outline"
                                className="cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); unassignStaff(user.id, sid, 'backup'); }}
                              >
                                {getStaffById(sid)?.name}
                                <X className="h-3 w-3 ml-1" />
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Connection Diagram (Middle) */}
              <div className="relative min-h-[400px] flex flex-col items-center justify-center">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  {filteredServiceUsers.map((user, userIndex) => {
                    const userY = 80 + userIndex * 120;
                    const staffList = staff;
                    
                    return (
                      <>
                        {/* Primary staff connection - solid line */}
                        {user.primaryStaffId && (
                          <line
                            key={`primary-${user.id}`}
                            x1="0%"
                            y1={userY}
                            x2="100%"
                            y2={80 + staffList.findIndex(s => s.id === user.primaryStaffId) * 80}
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            className="transition-all"
                          />
                        )}
                        {/* Backup staff connections - dotted lines */}
                        {user.backupStaffIds.map(backupId => (
                          <line
                            key={`backup-${user.id}-${backupId}`}
                            x1="0%"
                            y1={userY}
                            x2="100%"
                            y2={80 + staffList.findIndex(s => s.id === backupId) * 80}
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth="1.5"
                            strokeDasharray="5,5"
                            className="transition-all"
                          />
                        ))}
                      </>
                    );
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
                  
                  {selectedServiceUser && (
                    <Card className="text-left">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          Suggested Matches
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {getSuggestedStaff(selectedServiceUser).length > 0 ? (
                          <div className="space-y-2">
                            {getSuggestedStaff(selectedServiceUser).map(({ staff: s, score }) => (
                              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                                <span>{s.name}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{score}% match</Badge>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 text-xs"
                                    onClick={() => assignStaff(selectedServiceUser.id, s.id, 'primary')}
                                  >
                                    Set Primary
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 text-xs"
                                    onClick={() => assignStaff(selectedServiceUser.id, s.id, 'backup')}
                                  >
                                    Add Backup
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No strong matches found</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Staff Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Support Staff
                  </h2>
                  <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Add Staff Member</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Name</Label>
                          <Input 
                            value={newStaffForm.name} 
                            onChange={(e) => setNewStaffForm(f => ({ ...f, name: e.target.value }))}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label>Skills & Experience (comma separated)</Label>
                          <Textarea 
                            value={newStaffForm.skills} 
                            onChange={(e) => setNewStaffForm(f => ({ ...f, skills: e.target.value }))}
                            placeholder="Autism Trained, Personal Care, Makaton"
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input 
                            value={newStaffForm.location} 
                            onChange={(e) => setNewStaffForm(f => ({ ...f, location: e.target.value }))}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label>Interests (comma separated)</Label>
                          <Textarea 
                            value={newStaffForm.interests} 
                            onChange={(e) => setNewStaffForm(f => ({ ...f, interests: e.target.value }))}
                            placeholder="Gardening, Sports, Music"
                            className="bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Availability</Label>
                            <Select value={newStaffForm.availability} onValueChange={(v) => setNewStaffForm(f => ({ ...f, availability: v }))}>
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
                            <Select value={newStaffForm.roleType} onValueChange={(v) => setNewStaffForm(f => ({ ...f, roleType: v as "Primary" | "Backup" | "Float" }))}>
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
                
                {staff.map(s => (
                  <Card 
                    key={s.id} 
                    className={`cursor-pointer transition-all ${selectedStaff?.id === s.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                    onClick={() => setSelectedStaff(s)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{s.name}</h3>
                        <div className="flex gap-1 items-center">
                          <Badge 
                            variant={s.roleType === 'Primary' ? 'default' : s.roleType === 'Backup' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {s.roleType}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); handleDeleteStaff(s.id); }}
                          >
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
                        {s.skills.slice(0, 2).map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                        {s.skills.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{s.skills.length - 2}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Service Users Table */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Service Users</CardTitle>
                <Button onClick={() => setIsAddUserOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service User
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Support Needs</TableHead>
                      <TableHead>Preferences</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Primary Staff</TableHead>
                      <TableHead>Backup Staff</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.supportNeeds.map(need => (
                              <Badge key={need} variant="secondary" className="text-xs">{need}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.preferences.map(pref => (
                              <Badge key={pref} variant="outline" className="text-xs">{pref}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{user.location}</TableCell>
                        <TableCell>
                          {user.primaryStaffId ? (
                            <Badge className="bg-green-100 text-green-800">{getStaffById(user.primaryStaffId)?.name}</Badge>
                          ) : (
                            <span className="text-orange-600 text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.backupStaffIds.map(id => (
                              <Badge key={id} variant="outline">{getStaffById(id)?.name}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Table */}
          <TabsContent value="staff">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Support Staff</CardTitle>
                <Button onClick={() => setIsAddStaffOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Skills & Experience</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Interests</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead>Role Type</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {s.skills.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{s.location}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {s.interests.map(interest => (
                              <Badge key={interest} variant="outline" className="text-xs">{interest}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{s.availability}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={s.roleType === 'Primary' ? 'default' : s.roleType === 'Backup' ? 'secondary' : 'outline'}
                          >
                            {s.roleType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Matching;
