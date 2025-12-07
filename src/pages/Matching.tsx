import { useState, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MapPin, X, Edit2, Trash2, BarChart3, Printer, Check, Loader2, HelpCircle, FileDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { SearchableStaffSelect } from "@/components/SearchableStaffSelect";
import { 
  useMatchingData, 
  WEEKS, 
  createDefaultForecast,
  type ServiceUser, 
  type Staff, 
  type Gender, 
  type GenderPreference,
  type ContractType,
  type StaffAllocation,
  type WeeklyForecast
} from "@/hooks/useMatchingData";

const GENDER_PREFERENCES: GenderPreference[] = ["No Preference", "Male", "Female"];
const GENDERS: Gender[] = ["Male", "Female", "Non-Binary", "Prefer not to say"];

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
export const Matching = () => {
  const { toast } = useToast();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const { 
    serviceUsers, 
    staff, 
    loading, 
    saving,
    setServiceUsers, 
    setStaff,
    addStaff: addStaffToDb,
    addServiceUser: addServiceUserToDb,
    deleteStaff: deleteStaffFromDb,
    deleteServiceUser: deleteServiceUserFromDb
  } = useMatchingData();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [supportTypeFilter, setSupportTypeFilter] = useState<string>("all");
  const [userLocationFilter, setUserLocationFilter] = useState<string>("all");
  const [staffLocationFilter, setStaffLocationFilter] = useState<string>("all");
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
    location: "",
    typicalWeeklyHours: 0,
    supportNeeds: "",
    interests: "",
    genderPreference: "No Preference" as GenderPreference
  });
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    location: "",
    typicalWeeklyHours: 40,
    gender: "Prefer not to say" as Gender,
    contractType: "Full-Time Contract" as ContractType
  });
  const [newUserLocationInput, setNewUserLocationInput] = useState("");
  const [newStaffLocationInput, setNewStaffLocationInput] = useState("");
  const [isAddingUserLocation, setIsAddingUserLocation] = useState(false);
  const [isAddingStaffLocation, setIsAddingStaffLocation] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  
  // Add a custom location to the shared pool
  const addCustomLocation = (location: string) => {
    if (location.trim() && !customLocations.includes(location.trim())) {
      setCustomLocations(prev => [...prev, location.trim()]);
    }
  };
  
  const locations = useMemo(() => {
    const allLocations = [...new Set([
      ...serviceUsers.map(u => u.location), 
      ...staff.map(s => s.location),
      ...customLocations
    ])];
    return allLocations.filter(Boolean);
  }, [serviceUsers, staff, customLocations]);
  const supportTypes = useMemo(() => {
    const allNeeds = serviceUsers.flatMap(u => u.supportNeeds);
    return [...new Set(allNeeds)];
  }, [serviceUsers]);

  const handleExportPDF = async () => {
    if (!printAreaRef.current) return;
    
    setIsExporting(true);
    try {
      const element = printAreaRef.current;
      
      // Add temporary padding for PDF export
      element.style.padding = '20px';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Remove temporary padding
      element.style.padding = '';
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; // 15mm margins
      const contentWidth = pdfWidth - (margin * 2);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = contentWidth / imgWidth;
      const imgX = margin;
      const imgY = margin;
      
      // Handle multi-page if content is too tall
      const scaledHeight = imgHeight * ratio;
      const pageHeight = pdfHeight - 20; // margins
      
      if (scaledHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, scaledHeight);
      } else {
        let remainingHeight = scaledHeight;
        let sourceY = 0;
        let pageNum = 0;
        
        while (remainingHeight > 0) {
          if (pageNum > 0) pdf.addPage();
          
          const sliceHeight = Math.min(pageHeight, remainingHeight);
          const sourceSliceHeight = sliceHeight / ratio;
          
          pdf.addImage(
            imgData, 'PNG',
            imgX, imgY,
            imgWidth * ratio, scaledHeight,
            undefined, 'FAST',
            0
          );
          
          remainingHeight -= pageHeight;
          sourceY += sourceSliceHeight;
          pageNum++;
          
          if (pageNum > 20) break; // Safety limit
        }
      }
      
      pdf.save('staff-forecast.pdf');
      toast({ title: "PDF exported successfully" });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ title: "Failed to export PDF", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

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
  const handleAddUser = async () => {
    if (!newUserForm.name.trim()) {
      toast({
        title: "Please enter a name",
        variant: "destructive"
      });
      return;
    }
    console.log('Adding service user with data:', newUserForm);
    try {
      await addServiceUserToDb({
        name: newUserForm.name,
        supportNeeds: newUserForm.supportNeeds.split(",").map(s => s.trim()).filter(Boolean),
        preferences: newUserForm.interests.split(",").map(s => s.trim()).filter(Boolean),
        genderPreference: newUserForm.genderPreference,
        location: newUserForm.location,
        typicalWeeklyHours: newUserForm.typicalWeeklyHours,
        primaryStaffIds: [],
        backupStaffIds: [],
        forecastHours: createDefaultForecast(newUserForm.typicalWeeklyHours),
        staffAllocations: []
      });
      setNewUserForm({
        name: "",
        location: "",
        typicalWeeklyHours: 0,
        supportNeeds: "",
        interests: "",
        genderPreference: "No Preference"
      });
      setIsAddUserOpen(false);
      toast({
        title: "Service user added"
      });
    } catch (error) {
      console.error('Error adding service user:', error);
      toast({
        title: "Error adding service user",
        description: String(error),
        variant: "destructive"
      });
    }
  };
  const handleAddStaff = async () => {
    if (!newStaffForm.name.trim()) {
      toast({
        title: "Please enter a name",
        variant: "destructive"
      });
      return;
    }
    try {
      await addStaffToDb({
        name: newStaffForm.name,
        gender: newStaffForm.gender,
        location: newStaffForm.location,
        availability: "Full-time",
        status: "Active",
        typicalWeeklyHours: newStaffForm.typicalWeeklyHours,
        contractType: newStaffForm.contractType,
        forecastHours: createDefaultForecast(newStaffForm.typicalWeeklyHours)
      });
      setNewStaffForm({
        name: "",
        location: "",
        typicalWeeklyHours: 40,
        gender: "Prefer not to say",
        contractType: "Full-Time Contract"
      });
      setIsAddStaffOpen(false);
      toast({
        title: "Staff member added"
      });
    } catch (error) {
      console.error('Error adding staff member:', error);
      toast({
        title: "Error adding staff member",
        description: String(error),
        variant: "destructive"
      });
    }
  };
  const handleDeleteUser = async (id: string) => {
    try {
      await deleteServiceUserFromDb(id);
      setServiceUsers(prev => prev.filter(u => u.id !== id));
      toast({
        title: "Service user removed"
      });
    } catch (error) {
      toast({
        title: "Error removing service user",
        variant: "destructive"
      });
    }
  };
  const handleDeleteStaff = async (id: string) => {
    try {
      // Also unassign from any service users
      setServiceUsers(prev => prev.map(u => ({
        ...u,
        primaryStaffIds: u.primaryStaffIds.filter(sid => sid !== id),
        backupStaffIds: u.backupStaffIds.filter(sid => sid !== id)
      })));
      await deleteStaffFromDb(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Staff member removed"
      });
    } catch (error) {
      toast({
        title: "Error removing staff member",
        variant: "destructive"
      });
    }
  };
  return <div className="min-h-screen bg-background pt-24 pb-8 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
            
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading matching data...</span>
          </div>
        ) : (
        <Tabs defaultValue="diagram" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="diagram" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">Summary</TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">Service Users</TabsTrigger>
              <TabsTrigger value="staff" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">Staff</TabsTrigger>
            </TabsList>
            {saving && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </div>
            )}
          </div>

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
                <Button 
                  size="sm" 
                  onClick={handleExportPDF} 
                  disabled={isExporting}
                  className="text-white"
                  style={{ backgroundColor: '#202A38' }}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Export PDF
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
                <div ref={printAreaRef} className="print-area grid grid-cols-1 gap-6 bg-white">
                  {/* Staff Utilisation Forecast */}
                  <div className="rounded-2xl overflow-hidden shadow-md bg-white border border-border">
                    <div className="px-6 py-4" style={{ backgroundColor: '#202A38' }}>
                      <h3 className="font-bold text-xl text-white print:text-sm">
                        Staff Utilisation Forecast (8 Weeks)
                      </h3>
                    </div>
                    <div className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs py-1">Week</TableHead>
                          <TableHead className="text-xs py-1 text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 cursor-help">
                                    Required Hours
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white max-w-xs">
                                  <p className="text-sm">Total hours needed by all service users for the week</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead className="text-xs py-1 text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 cursor-help">
                                    Allocated Hours
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white max-w-xs">
                                  <p className="text-sm">Total hours assigned to primary staff across all service users</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead className="text-xs py-1 text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 cursor-help">
                                    Unallocated Hours
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white max-w-xs">
                                  <p className="text-sm">Available hours from staff not assigned as primary to any service user</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead className="text-xs py-1 text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 cursor-help">
                                    Utilisation Percentage
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white max-w-xs">
                                  <p className="text-sm">Utilisation = Allocated Hours ÷ (Allocated + Unallocated Hours) × 100</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead className="text-xs py-1 text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 cursor-help">
                                    Required FTE
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white max-w-xs">
                                  <p className="text-sm">FTE = Required Hours ÷ 35 hours per week</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead className="text-xs py-1 text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 cursor-help">
                                    Available FTE
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white max-w-xs">
                                  <p className="text-sm">FTE = (Allocated + Unallocated Hours) ÷ 35 hours per week</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
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
                          // Utilisation = allocated hours / total available hours (what % of available capacity is being used)
                          const utilisation = totalAvailableHours > 0 ? allocatedHours / totalAvailableHours * 100 : 0;
                          
                          // Calculate FTE based on 35 hour week
                          const FTE_HOURS = 35;
                          const requiredFTE = requiredHours / FTE_HOURS;
                          const availableFTE = totalAvailableHours / FTE_HOURS;
                          
                          // Determine utilisation color based on thresholds
                          let utilisationColor = "text-amber-600"; // default: under-utilised (<70%)
                          if (utilisation >= 70 && utilisation < 80) {
                            utilisationColor = "text-green-600"; // safe zone (70-80%)
                          } else if (utilisation >= 80 && utilisation < 90) {
                            utilisationColor = "text-amber-600"; // high zone (80-90%)
                          } else if (utilisation >= 90) {
                            utilisationColor = "text-red-600"; // over-utilised (>90%)
                          }
                          
                          return (
                            <TableRow key={week}>
                              <TableCell className="font-medium text-xs py-1">{week}</TableCell>
                              <TableCell className="text-right text-xs py-1">{requiredHours.toFixed(1)}</TableCell>
                              <TableCell className="text-right text-xs py-1">{allocatedHours.toFixed(1)}</TableCell>
                              <TableCell className="text-right text-xs py-1">{unallocatedHours.toFixed(1)}</TableCell>
                              <TableCell className={`text-right text-xs py-1 font-semibold ${utilisationColor}`}>{utilisation.toFixed(1)}%</TableCell>
                              <TableCell className="text-right text-xs py-1">{requiredFTE.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-xs py-1">{availableFTE.toFixed(2)}</TableCell>
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
                    </div>
                  </div>

                  
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
                
                return <div key={location} className="rounded-2xl overflow-hidden shadow-md bg-white border border-border">
                        {/* Colored Banner Header */}
                        <div className="px-6 py-4" style={{ backgroundColor: '#202A38' }}>
                          <h3 className="font-bold text-xl text-white print:text-sm">{location}</h3>
                          <span className="text-sm text-white/80">
                            {locationUsers.length} service users • {locationStaff.length} staff
                          </span>
                        </div>
                        
                        {/* Card Content */}
                        <div className="p-6 space-y-4">
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
                      // Calculate total allocated hours for this user
                      const userAllocatedHours = user.staffAllocations.reduce((sum, alloc) => 
                        sum + (alloc.allocatedHours[currentWeek] || 0), 0);
                      return <div key={user.id} className="rounded-lg p-4 print:p-2 bg-gray-50 border">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <span className="font-semibold text-base">{user.name}</span>
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                        {userRequiredHours}h required ({userAllocatedHours}h allocated)
                                      </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Needs: {user.supportNeeds.slice(0, 3).join(', ')}
                                      {user.supportNeeds.length > 3 && ` +${user.supportNeeds.length - 3}`}
                                    </div>
                                  </div>
                                </div>
                                
                                {allAssignedStaff.length > 0 ? <div className="mt-3 space-y-2">
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
                            return <div key={sid} className={`pl-3 border-l-4 ${type === 'Primary' ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-gray-100'} rounded-r-lg p-3`}>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm">{s.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${type === 'Primary' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                              {type}
                                            </span>
                                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                              {displayHours}h {hoursLabel}
                                            </span>
                                          </div>
                                          {narrative && <div className="text-sm text-muted-foreground mt-1 italic">
                                              {narrative}
                                            </div>}
                                        </div>;
                          })}
                                  </div> : <div className="text-sm text-orange-600 mt-2">No staff assigned</div>}
                              </div>;
                    })}
                          {locationUsers.length === 0 && <div className="text-sm text-muted-foreground italic">No service users in this location</div>}
                        </div>
                        
                        {/* Unassigned Staff in this location */}
                        {(() => {
                    const unassignedStaff = locationStaff.filter(s => !serviceUsers.some(u => u.primaryStaffIds.includes(s.id) || u.backupStaffIds.includes(s.id)));
                    if (unassignedStaff.length === 0) return null;
                    const currentWeek = WEEKS[0];
                    const totalUnallocatedHours = unassignedStaff.reduce((sum, s) => sum + (s.forecastHours[currentWeek] || 0), 0);
                    return <div className="mt-4 pt-4 border-t border-dashed">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-sm font-semibold text-muted-foreground">Unallocated Carers</div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {unassignedStaff.map(s => {
                                  const availableHours = s.forecastHours[currentWeek] || 0;
                                  return (
                                    <div key={s.id} className="inline-flex items-center bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 gap-2">
                                      <span className="text-xs font-medium text-orange-800">{s.name}</span>
                                      <span className="text-xs bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded-full">
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
                  <div className="flex items-center gap-3">
                    <Select value={userLocationFilter} onValueChange={setUserLocationFilter}>
                      <SelectTrigger className="w-40 bg-white">
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
                    <Button onClick={() => setIsAddUserOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service User
                    </Button>
                  </div>
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
                      {serviceUsers.filter(user => userLocationFilter === "all" || user.location === userLocationFilter).map(user => <TableRow key={user.id}>
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
                                // Update typical hours and sync all weeks in forecastHours
                                const updatedForecast: WeeklyForecast = {};
                                WEEKS.forEach(week => {
                                  updatedForecast[week] = value;
                                });
                                setServiceUsers(prev => prev.map(u => u.id === user.id ? {
                                  ...u,
                                  typicalWeeklyHours: value,
                                  forecastHours: updatedForecast
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
                                {user.supportNeeds.slice(0, 9).map(need => (
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
                                {user.supportNeeds.length > 9 && (
                                  <Badge variant="outline" className="text-xs">+{user.supportNeeds.length - 9}</Badge>
                                )}
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
                                {user.preferences.slice(0, 9).map(pref => (
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
                                {user.preferences.length > 9 && (
                                  <Badge variant="outline" className="text-xs">+{user.preferences.length - 9}</Badge>
                                )}
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
                  <div className="flex items-center gap-3">
                    <Select value={staffLocationFilter} onValueChange={setStaffLocationFilter}>
                      <SelectTrigger className="w-40 bg-white">
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
                    <Button onClick={() => setIsAddStaffOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff Member
                    </Button>
                  </div>
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
                      {staff.filter(s => staffLocationFilter === "all" || s.location === staffLocationFilter).map(s => <TableRow key={s.id}>
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
        )}

        {/* Add Service User Dialog - rendered at top level for immediate display */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent style={{ backgroundColor: '#F4F5F6' }}>
            <DialogHeader>
              <DialogTitle>Add Service User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input value={newUserForm.name} onChange={e => setNewUserForm(f => ({
                ...f,
                name: e.target.value
              }))} className="bg-white border-gray-800" />
              </div>
              <div>
                <Label>Location</Label>
                {isAddingUserLocation ? (
                  <div className="flex gap-2">
                    <Input 
                      value={newUserLocationInput} 
                      onChange={e => {
                        console.log('Location input changing to:', e.target.value);
                        setNewUserLocationInput(e.target.value);
                      }} 
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newUserLocationInput.trim()) {
                          e.preventDefault();
                          const newLoc = newUserLocationInput.trim();
                          addCustomLocation(newLoc);
                          setNewUserForm(f => ({ ...f, location: newLoc }));
                          setNewUserLocationInput('');
                          setIsAddingUserLocation(false);
                        } else if (e.key === 'Escape') {
                          setNewUserLocationInput('');
                          setIsAddingUserLocation(false);
                        }
                      }}
                      autoFocus
                      placeholder="Enter new location..."
                      className="bg-white border-gray-800 flex-1"
                    />
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={() => {
                        if (newUserLocationInput.trim()) {
                          const newLoc = newUserLocationInput.trim();
                          addCustomLocation(newLoc);
                          setNewUserForm(f => ({ ...f, location: newLoc }));
                          setNewUserLocationInput('');
                          setIsAddingUserLocation(false);
                        }
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button" 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewUserLocationInput('');
                        setIsAddingUserLocation(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Select 
                    value={newUserForm.location} 
                    onValueChange={v => {
                      console.log('Location select onValueChange:', v);
                      if (v === '__add_new__') {
                        setIsAddingUserLocation(true);
                      } else {
                        setNewUserForm(f => ({ ...f, location: v }));
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white border-gray-800">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-[100]" position="popper" sideOffset={4}>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="text-primary font-medium">
                        <div className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          Add new location
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Typical Weekly Hours</Label>
                <Input 
                  type="number" 
                  value={newUserForm.typicalWeeklyHours} 
                  onChange={e => setNewUserForm(f => ({
                    ...f,
                    typicalWeeklyHours: parseInt(e.target.value) || 0
                  }))} 
                  className="bg-white border-gray-800"
                />
              </div>
              <div>
                <Label>Support Needs (comma separated)</Label>
                <Textarea value={newUserForm.supportNeeds} onChange={e => setNewUserForm(f => ({
                ...f,
                supportNeeds: e.target.value
              }))} placeholder="Personal Care, Community Access" className="bg-white border-gray-800" />
              </div>
              <div>
                <Label>Interests (comma separated)</Label>
                <Textarea value={newUserForm.interests} onChange={e => setNewUserForm(f => ({
                ...f,
                interests: e.target.value
              }))} placeholder="Gardening, Music, Reading" className="bg-white border-gray-800" />
              </div>
              <div>
                <Label>Gender Preference</Label>
                <Select value={newUserForm.genderPreference} onValueChange={v => setNewUserForm(f => ({
                  ...f,
                  genderPreference: v as GenderPreference
                }))}>
                  <SelectTrigger className="bg-white border-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {GENDER_PREFERENCES.map(pref => (
                      <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddUser} className="w-full">Add Service User</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Staff Dialog - rendered at top level for immediate display */}
        <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
          <DialogContent style={{ backgroundColor: '#F4F5F6' }}>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input value={newStaffForm.name} onChange={e => setNewStaffForm(f => ({
                ...f,
                name: e.target.value
              }))} className="bg-white border-gray-800" />
              </div>
              <div>
                <Label>Location</Label>
                {isAddingStaffLocation ? (
                  <div className="flex gap-2">
                    <Input 
                      value={newStaffLocationInput} 
                      onChange={e => setNewStaffLocationInput(e.target.value)} 
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newStaffLocationInput.trim()) {
                          e.preventDefault();
                          const newLoc = newStaffLocationInput.trim();
                          addCustomLocation(newLoc);
                          setNewStaffForm(f => ({ ...f, location: newLoc }));
                          setNewStaffLocationInput('');
                          setIsAddingStaffLocation(false);
                        } else if (e.key === 'Escape') {
                          setNewStaffLocationInput('');
                          setIsAddingStaffLocation(false);
                        }
                      }}
                      autoFocus
                      placeholder="Enter new location..."
                      className="bg-white border-gray-800 flex-1" 
                    />
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={() => {
                        if (newStaffLocationInput.trim()) {
                          const newLoc = newStaffLocationInput.trim();
                          addCustomLocation(newLoc);
                          setNewStaffForm(f => ({ ...f, location: newLoc }));
                          setNewStaffLocationInput('');
                          setIsAddingStaffLocation(false);
                        }
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button" 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewStaffLocationInput('');
                        setIsAddingStaffLocation(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Select 
                    value={newStaffForm.location} 
                    onValueChange={v => {
                      if (v === '__add_new__') {
                        setIsAddingStaffLocation(true);
                      } else {
                        setNewStaffForm(f => ({ ...f, location: v }));
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white border-gray-800">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="text-primary font-medium">
                        <div className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          Add new location
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Typical Weekly Hours</Label>
                <Input 
                  type="number" 
                  value={newStaffForm.typicalWeeklyHours} 
                  onChange={e => setNewStaffForm(f => ({
                    ...f,
                    typicalWeeklyHours: parseInt(e.target.value) || 0
                  }))} 
                  className="bg-white border-gray-800"
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={newStaffForm.gender} onValueChange={v => setNewStaffForm(f => ({
                  ...f,
                  gender: v as Gender
                }))}>
                  <SelectTrigger className="bg-white border-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {GENDERS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contract Type</Label>
                <Select value={newStaffForm.contractType} onValueChange={v => setNewStaffForm(f => ({
                  ...f,
                  contractType: v as ContractType
                }))}>
                  <SelectTrigger className="bg-white border-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {CONTRACT_TYPES.map(ct => (
                      <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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