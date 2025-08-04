import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Palette, Building, Image, Upload, X } from "lucide-react";
import { TeamMembersManager } from "@/components/TeamMembersManager";

// Helper function to convert hex to HSL
const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};
const THEME_COLORS = [{
  name: "Red",
  value: "#dc2626"
}, {
  name: "Blue",
  value: "#2563eb"
}, {
  name: "Green",
  value: "#16a34a"
}, {
  name: "Yellow",
  value: "#eab308"
}, {
  name: "Black",
  value: "#1f2937"
}, {
  name: "Orange",
  value: "#ea580c"
}, {
  name: "Purple",
  value: "#9333ea"
}, {
  name: "Brown",
  value: "#92400e"
}];
const SERVICES = ["Domiciliary (Home) Care", "Supported Housing", "Nursing Homes", "Mental Health Support Services", "Day Services and Community Support", "Live-in Care", "Specialist Clinical Services", "Outreach and Floating Support", "Palliative and End-of-Life Care", "Substance Misuse Support", "Reablement Services", "Short Breaks and Respite Care", "Advocacy and Independent Living Support", "Community Nursing", "Early Help and Family Support Services"];
export const Settings = () => {
  const {
    profile,
    companies,
    fetchCompanies
  } = useAuth();
  const {
    toast
  } = useToast();
  
  // Check if user has permission to access settings
  const canAccessSettings = profile?.permission === 'company_admin' || profile?.role === 'admin';
  
  // If user doesn't have permission, show access denied message
  if (!canAccessSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the settings page. Only company administrators can manage company settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("#3b82f6");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<string>("");
  
  const currentCompany = companies.find(c => c.id === profile?.company_id);

  // Debug logging
  console.log("Settings Debug:", {
    profile,
    companies,
    currentCompany,
    profileCompanyId: profile?.company_id
  });
  useEffect(() => {
    const loadCompanySettings = async () => {
      if (!currentCompany) return;
      try {
        const {
          data,
          error
        } = await supabase.from("companies").select("theme_color, services, logo_url").eq("id", currentCompany.id).maybeSingle();
        if (error) throw error;
        if (data) {
          const themeColor = data.theme_color || "#3b82f6";
          setSelectedTheme(themeColor);
          setSelectedServices(data.services || []);
          setSelectedLogo(data.logo_url || "");

          // Apply theme color immediately on load
          document.documentElement.style.setProperty('--primary', hexToHsl(themeColor));
        }
      } catch (error) {
        console.error("Error loading company settings:", error);
      }
    };
    loadCompanySettings();
  }, [currentCompany]);
  const handleServiceChange = (service: string, checked: boolean) => {
    setSelectedServices(prev => checked ? [...prev, service] : prev.filter(s => s !== service));
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentCompany) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }
    setUploadingLogo(true);
    try {
      // Delete existing logo if any
      if (selectedLogo && selectedLogo.includes('supabase')) {
        const oldPath = selectedLogo.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('company-logos').remove([`${currentCompany.id}/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentCompany.id}/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('company-logos').upload(filePath, file);
      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data
      } = supabase.storage.from('company-logos').getPublicUrl(filePath);
      setSelectedLogo(data.publicUrl);
      toast({
        title: "Logo uploaded",
        description: "Your company logo has been uploaded successfully."
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const handleRemoveLogo = () => {
    setSelectedLogo("");
  };
  const handleSave = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from("companies").update({
        theme_color: selectedTheme,
        services: selectedServices,
        logo_url: selectedLogo
      }).eq("id", currentCompany.id);
      if (error) throw error;

      // Refresh companies data to update the cache
      await fetchCompanies();

      // Force reload the current company settings to ensure UI stays consistent
      const {
        data
      } = await supabase.from("companies").select("theme_color, services, logo_url").eq("id", currentCompany.id).maybeSingle();
      if (data) {
        const themeColor = data.theme_color || "#3b82f6";
        setSelectedTheme(themeColor);
        setSelectedServices(data.services || []);
        setSelectedLogo(data.logo_url || "");

        // Apply theme color after save
        document.documentElement.style.setProperty('--primary', hexToHsl(themeColor));
      }
      toast({
        title: "Settings saved",
        description: "Your company settings have been updated successfully."
      });

      // Apply theme color to CSS variables (converted to HSL)
      document.documentElement.style.setProperty('--primary', hexToHsl(selectedTheme));
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (!currentCompany) {
    return <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No company selected</p>
        </div>
      </div>;
  }
  return <div className="container mx-auto p-6 pt-24 space-y-6 bg-stone-50">
      <div className="flex items-center gap-3 mb-6">
        
        <div>
          
          
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {/* Theme Color Selection */}
        <Card>
          <CardHeader className="bg-stone-50">
            <CardTitle className="flex items-center gap-2">
              
              Theme Color
            </CardTitle>
            
          </CardHeader>
          <CardContent className="space-y-4 bg-stone-50">
            <div className="grid grid-cols-2 gap-3">
              {THEME_COLORS.map(color => <div key={color.value} className={`h-16 rounded-lg cursor-pointer transition-all hover:scale-105 ${selectedTheme === color.value ? "ring-4 ring-primary ring-offset-2" : "hover:ring-2 hover:ring-muted-foreground"}`} style={{
                backgroundColor: color.value
              }} onClick={() => {
                setSelectedTheme(color.value);
                // Apply theme color immediately for preview
                document.documentElement.style.setProperty('--primary', hexToHsl(color.value));
              }} />)}
            </div>
          </CardContent>
        </Card>

        {/* Services Selection */}
        <Card className="bg-stone-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              
              Services Provided
            </CardTitle>
            
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {SERVICES.map(service => <div key={service} className="flex items-center space-x-2">
                  <Checkbox id={service} checked={selectedServices.includes(service)} onCheckedChange={checked => handleServiceChange(service, checked as boolean)} />
                  <Label htmlFor={service} className="text-sm font-normal cursor-pointer">
                    {service}
                  </Label>
                </div>)}
            </div>
          </CardContent>
        </Card>


        {/* Logo Upload */}
        <Card className="bg-stone-50">
          <CardHeader>
            <CardTitle>
              Company Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Logo Display */}
            {selectedLogo && <div className="relative inline-block">
                <img src={selectedLogo} alt="Company Logo" className="w-32 h-32 rounded-lg object-cover border-2 border-border" />
                <Button size="sm" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full" onClick={handleRemoveLogo}>
                  <X className="h-3 w-3" />
                </Button>
              </div>}

            {/* Upload Button */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
              </Button>
              
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Office Team Management */}
      <div className="mt-6">
        <TeamMembersManager companyId={currentCompany.id} />
      </div>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6 bg-stone-50">
          <div className="flex justify-between items-center">
            <div>
              
              
            </div>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
};