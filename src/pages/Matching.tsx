import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MapPin, X, Edit2, Trash2, BarChart3, Printer, Check } from "lucide-react";
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
  confirmedNeeds: string[]; // Support needs this staff is confirmed to meet
  confirmedInterests: string[]; // Shared interests confirmed
}

type GenderPreference = "No Preference" | "Male" | "Female";
const GENDER_PREFERENCES: GenderPreference[] = ["No Preference", "Male", "Female"];

type Gender = "Male" | "Female" | "Non-Binary" | "Prefer not to say";
const GENDERS: Gender[] = ["Male", "Female", "Non-Binary", "Prefer not to say"];

interface ServiceUser {
  id: string;
  name: string;
  supportNeeds: string[];
  preferences: string[];
  genderPreference: GenderPreference;
  location: string;
  typicalWeeklyHours: number;
  primaryStaffIds: string[];
  backupStaffIds: string[];
  forecastHours: WeeklyForecast;
  staffAllocations: StaffAllocation[];
}
type ContractType = 
  | "Full-Time Contract"
  | "Part-Time Contract"
  | "Zero-Hours Contract"
  | "Fixed-Term Contract"
  | "Agency or Temporary Contract"
  | "Self-Employed/Independent Contractor"
  | "Apprenticeship Agreement"
  | "Bank Contract (Casual Staff)"
  | "Volunteer";

const CONTRACT_TYPES: ContractType[] = [
  "Full-Time Contract",
  "Part-Time Contract",
  "Zero-Hours Contract",
  "Fixed-Term Contract",
  "Agency or Temporary Contract",
  "Self-Employed/Independent Contractor",
  "Apprenticeship Agreement",
  "Bank Contract (Casual Staff)",
  "Volunteer"
];

interface Staff {
  id: string;
  name: string;
  gender: Gender;
  location: string;
  availability: string;
  status: "Active" | "On Leave" | "Inactive";
  typicalWeeklyHours: number;
  contractType: ContractType;
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
  preferences: ["Enjoys gardening", "Likes quiet environments"],
  genderPreference: "Male",
  location: "North London",
  typicalWeeklyHours: 21,
  primaryStaffIds: ["s1"],
  backupStaffIds: ["s3"],
  forecastHours: createDefaultForecast(21),
  staffAllocations: [{ staffId: "s1", allocatedHours: createDefaultForecast(21), confirmedNeeds: ["Autism", "Personal Care", "Community Access"], confirmedInterests: ["Enjoys gardening"] }]
}, {
  id: "su2",
  name: "Mary Johnson",
  supportNeeds: ["Hoisting", "PEG Feeding", "Dementia Care"],
  preferences: ["Enjoys music", "Likes pets"],
  genderPreference: "Female",
  location: "South London",
  typicalWeeklyHours: 30,
  primaryStaffIds: ["s2"],
  backupStaffIds: ["s4"],
  forecastHours: createDefaultForecast(30),
  staffAllocations: [{ staffId: "s2", allocatedHours: createDefaultForecast(30), confirmedNeeds: ["Hoisting", "PEG Feeding", "Dementia Care"], confirmedInterests: ["Enjoys music"] }]
}, {
  id: "su3",
  name: "David Williams",
  supportNeeds: ["Learning Disability", "Behaviour Support", "Community Access"],
  preferences: ["Enjoys sports", "Likes cooking"],
  genderPreference: "No Preference",
  location: "East London",
  typicalWeeklyHours: 25,
  primaryStaffIds: [],
  backupStaffIds: [],
  forecastHours: createDefaultForecast(25),
  staffAllocations: []
}];
const INITIAL_STAFF: Staff[] = [{
  id: "s1",
  name: "Sarah Brown",
  gender: "Female",
  location: "North London",
  availability: "Full-time",
  status: "Active",
  typicalWeeklyHours: 40,
  contractType: "Full-Time Contract",
  forecastHours: createDefaultForecast(40)
}, {
  id: "s2",
  name: "Emma Wilson",
  gender: "Female",
  location: "South London",
  availability: "Full-time",
  status: "Active",
  typicalWeeklyHours: 40,
  contractType: "Full-Time Contract",
  forecastHours: createDefaultForecast(40)
}, {
  id: "s3",
  name: "James Taylor",
  gender: "Male",
  location: "North London",
  availability: "Part-time",
  status: "Active",
  typicalWeeklyHours: 20,
  contractType: "Part-Time Contract",
  forecastHours: createDefaultForecast(20)
}, {
  id: "s4",
  name: "Lisa Anderson",
  gender: "Female",
  location: "South London",
  availability: "Full-time",
  status: "Active",
  typicalWeeklyHours: 40,
  contractType: "Full-Time Contract",
  forecastHours: createDefaultForecast(40)
}, {
  id: "s5",
  name: "Michael Chen",
  gender: "Male",
  location: "East London",
  availability: "Full-time",
  status: "Active",
  typicalWeeklyHours: 40,
  contractType: "Full-Time Contract",
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
    field: 'name' | 'supportNeeds' | 'location' | 'interests';
    type: 'user' | 'staff';
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Support needs confirmation dialog state
  const [needsConfirmDialog, setNeedsConfirmDialog] = useState<{
    userId: string;
    staffId: string;
    type: 'primary' | 'backup';
    selectedNeeds: string[];
    selectedInterests: string[];
  } | null>(null);

  // Gender mismatch confirmation dialog state
  const [genderMismatchDialog, setGenderMismatchDialog] = useState<{
    userId: string;
    staffId: string;
    type: 'primary' | 'backup';
    staffGender: string;
    userPreference: string;
  } | null>(null);

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    supportNeeds: "",
    preferences: "",
    location: ""
  });
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    location: "",
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

  // All interests/preferences for dropdowns
  const allInterests = useMemo(() => {
    const userPrefs = serviceUsers.flatMap(u => u.preferences);
    return [...new Set(userPrefs)].filter(Boolean);
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
    if (user.location === staffMember.location) score += 50;
    
    // Check if staff has confirmed needs for this user
    const allocation = user.staffAllocations.find(a => a.staffId === staffMember.id);
    if (allocation && allocation.confirmedNeeds.length > 0) {
      score += allocation.confirmedNeeds.length * 10;
    }

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
  
  // Check for gender mismatch before opening needs confirmation
  const checkGenderAndOpenDialog = (userId: string, staffId: string, type: 'primary' | 'backup') => {
    const user = serviceUsers.find(u => u.id === userId);
    const staffMember = staff.find(s => s.id === staffId);
    if (!user || !staffMember) return;

    // Check if there's a gender preference mismatch
    const hasGenderMismatch = user.genderPreference !== "No Preference" && 
      staffMember.gender !== user.genderPreference &&
      staffMember.gender !== "Non-Binary" &&
      staffMember.gender !== "Prefer not to say";

    if (hasGenderMismatch) {
      setGenderMismatchDialog({
        userId,
        staffId,
        type,
        staffGender: staffMember.gender,
        userPreference: user.genderPreference
      });
    } else {
      openNeedsConfirmDialog(userId, staffId, type);
    }
  };

  // Open the needs confirmation dialog before assigning staff
  const openNeedsConfirmDialog = (userId: string, staffId: string, type: 'primary' | 'backup') => {
    const user = serviceUsers.find(u => u.id === userId);
    if (!user) return;
    setNeedsConfirmDialog({
      userId,
      staffId,
      type,
      selectedNeeds: [],
      selectedInterests: []
    });
  };

  const confirmGenderMismatch = () => {
    if (!genderMismatchDialog) return;
    const { userId, staffId, type } = genderMismatchDialog;
    setGenderMismatchDialog(null);
    openNeedsConfirmDialog(userId, staffId, type);
  };

  const confirmAssignStaff = () => {
    if (!needsConfirmDialog) return;
    const { userId, staffId, type, selectedNeeds, selectedInterests } = needsConfirmDialog;
    
    setServiceUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      if (type === 'primary') {
        if (user.primaryStaffIds.includes(staffId)) return user;
        const newAllocation: StaffAllocation = {
          staffId,
          allocatedHours: createDefaultForecast(0),
          confirmedNeeds: selectedNeeds,
          confirmedInterests: selectedInterests
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
    setNeedsConfirmDialog(null);
  };

  const toggleNeed = (need: string) => {
    if (!needsConfirmDialog) return;
    setNeedsConfirmDialog(prev => {
      if (!prev) return null;
      const isSelected = prev.selectedNeeds.includes(need);
      return {
        ...prev,
        selectedNeeds: isSelected 
          ? prev.selectedNeeds.filter(n => n !== need)
          : [...prev.selectedNeeds, need]
      };
    });
  };

  const toggleInterest = (interest: string) => {
    if (!needsConfirmDialog) return;
    setNeedsConfirmDialog(prev => {
      if (!prev) return null;
      const isSelected = prev.selectedInterests.includes(interest);
      return {
        ...prev,
        selectedInterests: isSelected 
          ? prev.selectedInterests.filter(i => i !== interest)
          : [...prev.selectedInterests, interest]
      };
    });
  };

  const selectAllNeeds = () => {
    if (!needsConfirmDialog) return;
    const user = serviceUsers.find(u => u.id === needsConfirmDialog.userId);
    if (!user) return;
    setNeedsConfirmDialog(prev => {
      if (!prev) return null;
      return {
        ...prev,
        selectedNeeds: [...user.supportNeeds]
      };
    });
  };

  const selectAllInterests = () => {
    if (!needsConfirmDialog) return;
    const user = serviceUsers.find(u => u.id === needsConfirmDialog.userId);
    if (!user) return;
    setNeedsConfirmDialog(prev => {
      if (!prev) return null;
      return {
        ...prev,
        selectedInterests: [...user.preferences]
      };
    });
  };

  const updateStaffAllocation = (userId: string, staffId: string, week: string, hours: number) => {
    // Find the staff member to check their available hours
    const staffMember = getStaffById(staffId);
    if (!staffMember) return;

    // Calculate how many hours this staff is already allocated to OTHER service users for this week
    const otherAllocations = serviceUsers
      .filter(u => u.id !== userId)
      .reduce((sum, u) => {
        const alloc = u.staffAllocations.find(a => a.staffId === staffId);
        return sum + (alloc?.allocatedHours[week] || 0);
      }, 0);

    // Get current allocation for this service user
    const currentUser = serviceUsers.find(u => u.id === userId);
    if (!currentUser) return;

    // Check 1: Don't exceed staff's available hours for this week
    const staffAvailableHours = staffMember.forecastHours[week] || 0;
    const maxStaffHours = staffAvailableHours - otherAllocations;
    
    // Check 2: Don't exceed service user's required hours for this week
    const userRequiredHours = currentUser.forecastHours[week] || 0;
    
    // Get total allocated hours from OTHER staff for this service user
    const otherStaffAllocations = currentUser.staffAllocations
      .filter(a => a.staffId !== staffId)
      .reduce((sum, a) => sum + (a.allocatedHours[week] || 0), 0);
    
    const maxUserHours = userRequiredHours - otherStaffAllocations;

    // Apply the minimum of both constraints
    const validatedHours = Math.max(0, Math.min(hours, maxStaffHours, maxUserHours));

    // Show toast if hours were capped
    if (hours > validatedHours && hours > 0) {
      const reason = hours > maxStaffHours 
        ? `${staffMember.name} only has ${maxStaffHours}h available this week`
        : `${currentUser.name} only needs ${maxUserHours}h more this week`;
      toast({
        title: "Hours adjusted",
        description: reason,
        variant: "destructive"
      });
    }

    setServiceUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      const updatedAllocations = user.staffAllocations.map(alloc => {
        if (alloc.staffId !== staffId) return alloc;
        return {
          ...alloc,
          allocatedHours: { ...alloc.allocatedHours, [week]: validatedHours }
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
      genderPreference: "No Preference",
      location: newUserForm.location,
      typicalWeeklyHours: 0,
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
      gender: "Prefer not to say",
      location: newStaffForm.location,
      availability: newStaffForm.availability,
      status: "Active",
      typicalWeeklyHours: 40,
      contractType: "Full-Time Contract",
      forecastHours: createDefaultForecast(40)
    };
    setStaff(prev => [...prev, newStaffMember]);
    setNewStaffForm({
      name: "",
      location: "",
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

        <Tabs defaultValue="diagram" className="space-y-6">
          <TabsList>
            <TabsTrigger value="diagram">Matching</TabsTrigger>
            <TabsTrigger value="users">Service Users</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          {/* Matching View */}
          <TabsContent value="diagram" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Location Filter and Print Button */}
              <div className="flex justify-end gap-3 print:hidden">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-48 bg-white">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <div className="print-area grid grid-cols-1 gap-6">
                  {/* Staff Utilisation Forecast */}
                  <Card>
                    <CardHeader className="py-2 border-b">
                      <CardTitle className="text-sm">
                        Staff Utilisation Forecast (8 Weeks)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-4">
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
                          // Filter by location if a specific location is selected
                          const filteredUsers = locationFilter === "all" 
                            ? serviceUsers 
                            : serviceUsers.filter(u => u.location === locationFilter);
                          const filteredStaff = locationFilter === "all"
                            ? staff
                            : staff.filter(s => s.location === locationFilter);
                          
                          const requiredHours = filteredUsers.reduce((sum, u) => sum + (u.forecastHours[week] || 0), 0);
                          // Allocated hours = sum of all staff allocations across service users for this week
                          const allocatedHours = filteredUsers.reduce((sum, u) => 
                            sum + u.staffAllocations.reduce((staffSum, alloc) => 
                              staffSum + (alloc.allocatedHours[week] || 0), 0), 0);
                          // Unallocated hours = sum of hours from staff NOT assigned as PRIMARY to any service user
                          const primaryStaffIds = new Set(filteredUsers.flatMap(u => u.primaryStaffIds));
                          const unallocatedHours = filteredStaff
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
                      {locationFilter === "all" 
                        ? `${serviceUsers.length} service users` 
                        : `${serviceUsers.filter(u => u.location === locationFilter).length} service users in ${locationFilter}`
                      } • Sum of forecasted hours shown above
                    </div>
                  </CardContent>
                </Card>

                  
                  {locations
                    .filter(location => locationFilter === "all" || location === locationFilter)
                    .map(location => {
                const locationUsers = serviceUsers.filter(u => u.location === location);
                const locationStaff = staff.filter(s => s.location === location);
                if (locationUsers.length === 0 && locationStaff.length === 0) return null;

                // Helper to get match reasons between user and staff (based on confirmed needs)
                const getMatchReasons = (user: ServiceUser, staffMember: Staff): string[] => {
                  const reasons: string[] = [];

                  // Get confirmed needs for this staff-user pairing
                  const allocation = user.staffAllocations.find(a => a.staffId === staffMember.id);
                  if (allocation && allocation.confirmedNeeds.length > 0) {
                    reasons.push(`Confirmed for: ${allocation.confirmedNeeds.slice(0, 3).join(', ')}`);
                  }

                  // Location match
                  if (user.location === staffMember.location) {
                    reasons.push('Same location');
                  }
                  return reasons;
                };
                return <div key={location} className="border rounded-lg p-3 print:border-black print:p-2 bg-primary-foreground">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
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

                            // Build commentary-driven narrative
                            const buildMatchingNarrative = () => {
                              const allocation = user.staffAllocations.find(a => a.staffId === sid);
                              const staffFirstName = s.name.split(' ')[0];
                              const userFirstName = user.name.split(' ')[0];
                              const sentences: string[] = [];

                              // Gender preference match
                              if (user.genderPreference !== "No Preference") {
                                if (s.gender === user.genderPreference) {
                                  sentences.push(`matches ${userFirstName}'s preference for a ${user.genderPreference.toLowerCase()} carer`);
                                } else {
                                  sentences.push(`(${s.gender.toLowerCase()}) does not match ${userFirstName}'s preference for a ${user.genderPreference.toLowerCase()} carer`);
                                }
                              }

                              // Location match
                              if (user.location === s.location) {
                                sentences.push(`is based in the same area (${s.location})`);
                              } else {
                                sentences.push(`is based in ${s.location}`);
                              }

                              // Support needs alignment
                              if (allocation && allocation.confirmedNeeds.length > 0) {
                                const needsList = allocation.confirmedNeeds.length <= 3 
                                  ? allocation.confirmedNeeds.join(', ')
                                  : allocation.confirmedNeeds.slice(0, 3).join(', ') + ` and ${allocation.confirmedNeeds.length - 3} more`;
                                sentences.push(`has the skills and experience to support with ${needsList}`);
                              }

                              // Shared interests
                              if (allocation && allocation.confirmedInterests && allocation.confirmedInterests.length > 0) {
                                const interestsList = allocation.confirmedInterests.length <= 2
                                  ? allocation.confirmedInterests.join(' and ')
                                  : allocation.confirmedInterests.slice(0, 2).join(', ') + ` and ${allocation.confirmedInterests.length - 2} more`;
                                sentences.push(`shares interests in ${interestsList}`);
                              }

                              if (sentences.length === 0) return null;

                              // Build flowing narrative
                              const firstSentence = sentences[0];
                              const restSentences = sentences.slice(1);
                              
                              if (restSentences.length === 0) {
                                return `${staffFirstName} ${firstSentence}.`;
                              }
                              
                              return `${staffFirstName} ${firstSentence}, ${restSentences.join(', ')}.`;
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
                                              {narrative}
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
                    const currentWeek = WEEKS[0];
                    const totalUnallocatedHours = unassignedStaff.reduce((sum, s) => sum + (s.forecastHours[currentWeek] || 0), 0);
                    return <div className="mt-3 pt-3 border-t border-dashed">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-[10px] font-medium text-muted-foreground">Unallocated Carers:</div>
                                <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                                  {totalUnallocatedHours}h total available ({currentWeek})
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {unassignedStaff.map(s => {
                                  const availableHours = s.forecastHours[currentWeek] || 0;
                                  return (
                                    <div key={s.id} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded px-2 py-1.5">
                                      <span className="text-[10px] font-medium text-orange-800 truncate">{s.name}</span>
                                      <span className="text-[9px] bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded ml-2 shrink-0">
                                        {availableHours}h
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>;
                  })()}
                      </div>;
              })}
                </div>
              </div>
            </div>
          </TabsContent>


          {/* Service Users Table */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Service Users Directory */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b">
                  <CardTitle>Service Users Directory</CardTitle>
                  <Button onClick={() => setIsAddUserOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service User
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Typical Weekly Hours</TableHead>
                        <TableHead>Gender Preference</TableHead>
                        <TableHead>Support Needs</TableHead>
                        <TableHead>Interests</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceUsers.map(user => <TableRow key={user.id}>
                          {/* Name */}
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
                          {/* Location */}
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
                          {/* Typical Weekly Hours */}
                          <TableCell>
                            <Input 
                              type="number" 
                              value={user.typicalWeeklyHours} 
                              onChange={e => {
                                const value = parseFloat(e.target.value) || 0;
                                setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                  ...u,
                                  typicalWeeklyHours: value
                                } : u));
                              }} 
                              className="h-8 w-20 text-center bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            />
                          </TableCell>
                          {/* Gender Preference */}
                          <TableCell>
                            <Select value={user.genderPreference} onValueChange={(value: GenderPreference) => {
                              setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                ...u,
                                genderPreference: value
                              } : u));
                            }}>
                              <SelectTrigger className="h-8 w-32 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-50">
                                {GENDER_PREFERENCES.map(pref => (
                                  <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {/* Support Needs */}
                          <TableCell>
                            {editingCell?.id === user.id && editingCell?.field === 'supportNeeds' && editingCell?.type === 'user' ? (
                              <Input 
                                value={editValue} 
                                onChange={e => setEditValue(e.target.value)} 
                                onBlur={() => {
                                  if (editValue.trim()) {
                                    setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                      ...u,
                                      supportNeeds: [...u.supportNeeds, editValue.trim()]
                                    } : u));
                                  }
                                  setEditingCell(null);
                                }} 
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && editValue.trim()) {
                                    setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                      ...u,
                                      supportNeeds: [...u.supportNeeds, editValue.trim()]
                                    } : u));
                                    setEditingCell(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }} 
                                autoFocus 
                                placeholder="Enter new support need..." 
                                className="h-8 bg-white min-w-[150px]" 
                              />
                            ) : (
                              <div className="flex flex-wrap gap-1 items-center">
                                {user.supportNeeds.map(need => (
                                  <Badge key={need} variant="secondary" className="text-xs flex items-center gap-1">
                                    {need}
                                    <X 
                                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                          ...u,
                                          supportNeeds: u.supportNeeds.filter(n => n !== need)
                                        } : u));
                                      }}
                                    />
                                  </Badge>
                                ))}
                                <Select 
                                  value="" 
                                  onValueChange={value => {
                                    if (value === '__add_new__') {
                                      setEditingCell({ id: user.id, field: 'supportNeeds', type: 'user' });
                                      setEditValue('');
                                    } else if (!user.supportNeeds.includes(value)) {
                                      setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                        ...u,
                                        supportNeeds: [...u.supportNeeds, value]
                                      } : u));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-6 p-0 border-dashed">
                                    <Plus className="h-3 w-3" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white z-50">
                                    {supportTypes.filter(t => !user.supportNeeds.includes(t)).map(type => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                    <SelectItem value="__add_new__" className="text-primary font-medium">
                                      <div className="flex items-center gap-1">
                                        <Plus className="h-3 w-3" />
                                        Add new
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </TableCell>
                          {/* Interests */}
                          <TableCell>
                            {editingCell?.id === user.id && editingCell?.field === 'interests' && editingCell?.type === 'user' ? (
                              <Input 
                                value={editValue} 
                                onChange={e => setEditValue(e.target.value)} 
                                onBlur={() => {
                                  if (editValue.trim()) {
                                    setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                      ...u,
                                      preferences: [...u.preferences, editValue.trim()]
                                    } : u));
                                  }
                                  setEditingCell(null);
                                }} 
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && editValue.trim()) {
                                    setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                      ...u,
                                      preferences: [...u.preferences, editValue.trim()]
                                    } : u));
                                    setEditingCell(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }} 
                                autoFocus 
                                placeholder="Enter new interest..." 
                                className="h-8 bg-white min-w-[150px]" 
                              />
                            ) : (
                              <div className="flex flex-wrap gap-1 items-center">
                                {user.preferences.map(pref => (
                                  <Badge key={pref} variant="outline" className="text-xs flex items-center gap-1">
                                    {pref}
                                    <X 
                                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                          ...u,
                                          preferences: u.preferences.filter(p => p !== pref)
                                        } : u));
                                      }}
                                    />
                                  </Badge>
                                ))}
                                <Select 
                                  value="" 
                                  onValueChange={value => {
                                    if (value === '__add_new__') {
                                      setEditingCell({ id: user.id, field: 'interests', type: 'user' });
                                      setEditValue('');
                                    } else if (!user.preferences.includes(value)) {
                                      setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                        ...u,
                                        preferences: [...u.preferences, value]
                                      } : u));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-6 p-0 border-dashed">
                                    <Plus className="h-3 w-3" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white z-50">
                                    {allInterests.filter(i => !user.preferences.includes(i)).map(interest => (
                                      <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                                    ))}
                                    <SelectItem value="__add_new__" className="text-primary font-medium">
                                      <div className="flex items-center gap-1">
                                        <Plus className="h-3 w-3" />
                                        Add new
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </TableCell>
                          {/* Delete */}
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

              {/* Weekly Allocation Grid */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Weekly Allocation (8 Weeks)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
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
                                  className="h-8 w-16 text-center bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
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
                                      className="h-8 w-16 text-center bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                    />
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
                          })}
                          
                          {/* Unallocated Hours Row */}
                          <TableRow key={`${user.id}-unallocated`} className="bg-orange-50">
                            <TableCell className="sticky left-0 bg-orange-50 pl-6">
                              <span className="text-sm font-medium text-orange-700">Unallocated Hours</span>
                            </TableCell>
                            {WEEKS.map(week => {
                              const requiredHours = user.forecastHours[week] || 0;
                              const allocatedHours = user.staffAllocations.reduce((sum, alloc) => sum + (alloc.allocatedHours[week] || 0), 0);
                              const unallocatedHours = requiredHours - allocatedHours;
                              return (
                                <TableCell key={week} className="text-center">
                                  <span className={`text-sm font-medium ${unallocatedHours > 0 ? 'text-orange-700' : unallocatedHours < 0 ? 'text-red-700' : 'text-green-700'}`}>
                                    {unallocatedHours}
                                  </span>
                                </TableCell>
                              );
                            })}
                          </TableRow>

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
                                  onSelect={value => checkGenderAndOpenDialog(user.id, value, 'primary')} 
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
                                  onSelect={value => checkGenderAndOpenDialog(user.id, value, 'backup')} 
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
            </div>
          </TabsContent>

          {/* Staff Table */}
          <TabsContent value="staff" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Staff Directory */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b">
                  <CardTitle>Staff Directory</CardTitle>
                  <Button onClick={() => setIsAddStaffOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Typical Weekly Hours</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Contract Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map(s => <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>
                            <Select 
                              value={s.location} 
                              onValueChange={(value) => {
                                if (value === "__add_new__") {
                                  const newLocation = prompt("Enter new location:");
                                  if (newLocation && newLocation.trim()) {
                                    setStaff(prev => prev.map(staff => staff.id === s.id ? {
                                      ...staff,
                                      location: newLocation.trim()
                                    } : staff));
                                  }
                                } else {
                                  setStaff(prev => prev.map(staff => staff.id === s.id ? {
                                    ...staff,
                                    location: value
                                  } : staff));
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-40 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-50">
                                {locations.map(loc => (
                                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                                <SelectItem value="__add_new__">+ Add New Location</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={s.typicalWeeklyHours} 
                              onChange={e => {
                                const value = parseFloat(e.target.value) || 0;
                                // Update staff hours
                                setStaff(prev => prev.map(staff => staff.id === s.id ? {
                                  ...staff,
                                  typicalWeeklyHours: value,
                                  forecastHours: createDefaultForecast(value)
                                } : staff));
                                // Zero out allocations for this staff member across all service users
                                setServiceUsers(prev => prev.map(user => ({
                                  ...user,
                                  staffAllocations: user.staffAllocations.map(alloc => 
                                    alloc.staffId === s.id 
                                      ? { ...alloc, allocatedHours: createDefaultForecast(0) }
                                      : alloc
                                  )
                                })));
                              }} 
                              className="h-8 w-20 text-center bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            />
                          </TableCell>
                          {/* Gender */}
                          <TableCell>
                            <Select value={s.gender} onValueChange={(value: Gender) => {
                              setStaff(prev => prev.map(staff => staff.id === s.id ? {
                                ...staff,
                                gender: value
                              } : staff));
                            }}>
                              <SelectTrigger className="h-8 w-36 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-50">
                                {GENDERS.map(gender => (
                                  <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={s.contractType} onValueChange={(value: ContractType) => {
                              setStaff(prev => prev.map(staff => staff.id === s.id ? {
                                ...staff,
                                contractType: value
                              } : staff));
                            }}>
                              <SelectTrigger className="h-8 w-48 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-50">
                                {CONTRACT_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
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

              {/* Available Hours Grid */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Available Hours (8 Weeks)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-background min-w-[200px]">Name</TableHead>
                          {WEEKS.map(week => <TableHead key={week} className="text-center min-w-[100px]">{week}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.map(s => (
                          <TableRow key={s.id} className="bg-green-50">
                            <TableCell className="font-medium sticky left-0 bg-green-50">
                              <div className="flex flex-col">
                                <span>{s.name}</span>
                                <span className="text-xs text-muted-foreground">{s.location}</span>
                              </div>
                            </TableCell>
                            {WEEKS.map(week => (
                              <TableCell key={week} className="text-center">
                                <Input 
                                  type="number" 
                                  value={s.forecastHours[week] || 0} 
                                  onChange={e => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setStaff(prev => prev.map(staff => staff.id === s.id ? {
                                      ...staff,
                                      forecastHours: { ...staff.forecastHours, [week]: value }
                                    } : staff));
                                  }} 
                                  className="h-8 w-16 text-center bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50 font-semibold">
                          <TableCell className="sticky left-0 bg-blue-50">
                            <div className="flex flex-col">
                              <span>Total Available</span>
                              <span className="text-xs text-muted-foreground">All Staff</span>
                            </div>
                          </TableCell>
                          {WEEKS.map(week => (
                            <TableCell key={week} className="text-center font-semibold">
                              {staff.reduce((sum, s) => sum + (s.forecastHours[week] || 0), 0)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
              </CardContent>
            </Card>
            </div>
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
                <Label>Location</Label>
                <Input value={newStaffForm.location} onChange={e => setNewStaffForm(f => ({
                ...f,
                location: e.target.value
              }))} className="bg-white" />
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

        {/* Gender Mismatch Confirmation Dialog */}
        <Dialog open={!!genderMismatchDialog} onOpenChange={(open) => !open && setGenderMismatchDialog(null)}>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle>Gender Preference Mismatch</DialogTitle>
            </DialogHeader>
            {genderMismatchDialog && (() => {
              const user = serviceUsers.find(u => u.id === genderMismatchDialog.userId);
              const staffMember = getStaffById(genderMismatchDialog.staffId);
              if (!user || !staffMember) return null;
              return (
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>{user.name}</strong> has a gender preference for <strong>{genderMismatchDialog.userPreference}</strong> carers, 
                    but <strong>{staffMember.name}</strong> is <strong>{genderMismatchDialog.staffGender}</strong>.
                  </p>
                  <p className="text-sm text-amber-600 font-medium">
                    Do you want to proceed with this assignment anyway?
                  </p>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setGenderMismatchDialog(null)}>
                      Cancel
                    </Button>
                    <Button onClick={confirmGenderMismatch}>
                      Proceed Anyway
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Support Needs & Interests Confirmation Dialog */}
        <Dialog open={!!needsConfirmDialog} onOpenChange={(open) => !open && setNeedsConfirmDialog(null)}>
          <DialogContent className="bg-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Confirm Matching Criteria</DialogTitle>
            </DialogHeader>
            {needsConfirmDialog && (() => {
              const user = serviceUsers.find(u => u.id === needsConfirmDialog.userId);
              const staffMember = getStaffById(needsConfirmDialog.staffId);
              if (!user || !staffMember) return null;
              return (
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Select which of <strong>{user.name}'s</strong> needs and interests <strong>{staffMember.name}</strong> can meet:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Support Needs Column */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Support Needs</Label>
                        <Button variant="outline" size="sm" onClick={selectAllNeeds} className="h-6 text-xs">
                          Match All
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                        {user.supportNeeds.map(need => {
                          const isSelected = needsConfirmDialog.selectedNeeds.includes(need);
                          return (
                            <div 
                              key={need} 
                              className={`flex items-center gap-3 p-2 rounded border cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-green-50 border-green-300' : ''}`}
                              onClick={() => toggleNeed(need)}
                            >
                              <div className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <span className="text-sm">{need}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Shared Interests Column */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Shared Interests</Label>
                        <Button variant="outline" size="sm" onClick={selectAllInterests} className="h-6 text-xs">
                          Match All
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                        {user.preferences.map(interest => {
                          const isSelected = needsConfirmDialog.selectedInterests.includes(interest);
                          return (
                            <div 
                              key={interest} 
                              className={`flex items-center gap-3 p-2 rounded border cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-blue-50 border-blue-300' : ''}`}
                              onClick={() => toggleInterest(interest)}
                            >
                              <div className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <span className="text-sm">{interest}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setNeedsConfirmDialog(null)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={confirmAssignStaff}
                      disabled={needsConfirmDialog.selectedNeeds.length === 0}
                    >
                      Assign as {needsConfirmDialog.type === 'primary' ? 'Primary' : 'Backup'}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};

export default Matching;