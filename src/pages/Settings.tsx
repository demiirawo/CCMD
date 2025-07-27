import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Palette, Building, Image, Upload, X } from "lucide-react";

const THEME_COLORS = [
  { name: "Blue", value: "#3b82f6", description: "Professional and trustworthy" },
  { name: "Green", value: "#10b981", description: "Growth and harmony" },
  { name: "Purple", value: "#8b5cf6", description: "Creative and innovative" },
  { name: "Orange", value: "#f59e0b", description: "Energetic and friendly" },
  { name: "Red", value: "#ef4444", description: "Bold and confident" },
  { name: "Teal", value: "#14b8a6", description: "Calm and balanced" },
  { name: "Pink", value: "#ec4899", description: "Compassionate and caring" },
  { name: "Indigo", value: "#6366f1", description: "Professional and modern" }
];

const SERVICES = [
  "Domiciliary (Home) Care",
  "Supported Living",
  "Residential Care Homes",
  "Nursing Homes",
  "Children's Residential Services",
  "Fostering and Adoption Services",
  "Semi-Independent (16+) Living",
  "Mental Health Support Services",
  "Day Services and Community Support",
  "Live-in Care",
  "Specialist Clinical Services",
  "Outreach and Floating Support",
  "Palliative and End-of-Life Care",
  "Substance Misuse Support",
  "Reablement Services",
  "Short Breaks and Respite Care",
  "Advocacy and Independent Living Support",
  "Community Nursing",
  "Housing-Related Support",
  "Early Help and Family Support Services"
];

const LOGO_OPTIONS = [
  { name: "Robot", url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&fit=crop&crop=center" },
  { name: "Code", url: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=200&h=200&fit=crop&crop=center" },
  { name: "MacBook", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&h=200&fit=crop&crop=center" },
  { name: "iMac", url: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=200&h=200&fit=crop&crop=center" },
  { name: "Building", url: "https://images.unsplash.com/photo-1459767129954-1b1c1f9b9ace?w=200&h=200&fit=crop&crop=center" }
];

export const Settings = () => {
  const { profile, companies, fetchCompanies } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("#3b82f6");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<string>("");

  const currentCompany = companies.find(c => c.id === profile?.company_id);

  useEffect(() => {
    const loadCompanySettings = async () => {
      if (!currentCompany) return;

      try {
        const { data, error } = await supabase
          .from("companies")
          .select("theme_color, services, logo_url")
          .eq("id", currentCompany.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSelectedTheme(data.theme_color || "#3b82f6");
          setSelectedServices(data.services || []);
          setSelectedLogo(data.logo_url || "");
        }
      } catch (error) {
        console.error("Error loading company settings:", error);
      }
    };

    loadCompanySettings();
  }, [currentCompany]);

  const handleServiceChange = (service: string, checked: boolean) => {
    setSelectedServices(prev => 
      checked 
        ? [...prev, service]
        : prev.filter(s => s !== service)
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentCompany) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Delete existing logo if any
      if (selectedLogo && selectedLogo.includes('supabase')) {
        const oldPath = selectedLogo.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('company-logos')
            .remove([`${currentCompany.id}/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentCompany.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setSelectedLogo(data.publicUrl);

      toast({
        title: "Logo uploaded",
        description: "Your company logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
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
      const { error } = await supabase
        .from("companies")
        .update({
          theme_color: selectedTheme,
          services: selectedServices,
          logo_url: selectedLogo
        })
        .eq("id", currentCompany.id);

      if (error) throw error;

      // Refresh companies data to update the cache
      await fetchCompanies();

      toast({
        title: "Settings saved",
        description: "Your company settings have been updated successfully.",
      });

      // Apply theme color to CSS variables
      document.documentElement.style.setProperty('--primary', selectedTheme);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentCompany) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No company selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Building className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground">Configure your company's appearance and services</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {/* Theme Color Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Color
            </CardTitle>
            <CardDescription>
              Choose a primary color for your company's interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {THEME_COLORS.map((color) => (
                <div
                  key={color.value}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                    selectedTheme === color.value 
                      ? "border-primary shadow-md" 
                      : "border-border hover:border-muted-foreground"
                  }`}
                  onClick={() => setSelectedTheme(color.value)}
                >
                  <div 
                    className="w-8 h-8 rounded-full mb-2 mx-auto"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="text-center">
                    <p className="font-medium text-sm">{color.name}</p>
                    <p className="text-xs text-muted-foreground">{color.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Services Provided
            </CardTitle>
            <CardDescription>
              Select the services your company provides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {SERVICES.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={selectedServices.includes(service)}
                    onCheckedChange={(checked) => 
                      handleServiceChange(service, checked as boolean)
                    }
                  />
                  <Label htmlFor={service} className="text-sm font-normal cursor-pointer">
                    {service}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Company Logo
            </CardTitle>
            <CardDescription>
              Upload your company logo (max 5MB, image files only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Logo Display */}
            {selectedLogo && (
              <div className="relative inline-block">
                <img 
                  src={selectedLogo} 
                  alt="Company Logo"
                  className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Predefined Options */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Or choose from predefined options:</p>
              <div className="grid grid-cols-2 gap-3">
                {LOGO_OPTIONS.map((logo) => (
                  <div
                    key={logo.url}
                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all hover:scale-102 ${
                      selectedLogo === logo.url 
                        ? "border-primary shadow-md" 
                        : "border-border hover:border-muted-foreground"
                    }`}
                    onClick={() => setSelectedLogo(logo.url)}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={logo.url} 
                        alt={logo.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <p className="text-sm font-medium">{logo.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Save Settings</p>
              <p className="text-sm text-muted-foreground">
                Apply your changes to {currentCompany.name}
              </p>
            </div>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};