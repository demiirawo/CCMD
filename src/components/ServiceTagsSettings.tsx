import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, Plus, X, Tags } from "lucide-react";

interface ServiceTagsSettingsProps {
  companyId: string;
  selectedServices: string[];
}

interface SectionItem {
  id: string;
  title: string;
  sectionId: string;
  sectionTitle: string;
}

export const ServiceTagsSettings = ({ companyId, selectedServices }: ServiceTagsSettingsProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [serviceTags, setServiceTags] = useState<Record<string, string[]>>({});
  const [newTagInput, setNewTagInput] = useState<Record<string, string>>({});
  const [sectionItems, setSectionItems] = useState<SectionItem[]>([]);

  // Set first service as default when services change
  useEffect(() => {
    const mainServices = selectedServices.filter(s => !s.startsWith('  -'));
    if (mainServices.length > 0 && !selectedService) {
      setSelectedService(mainServices[0]);
    }
  }, [selectedServices, selectedService]);

  // Load all subsections from the dashboard structure
  useEffect(() => {
    const items: SectionItem[] = [
      // Staffing
      { id: "recruitment", title: "Capacity Planning", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "staff-documents", title: "Staff Documents", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "training", title: "Training & Development", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "spot-checks", title: "Spot Checks", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "staff-supervisions", title: "Staff Supervisions", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "staff-meetings", title: "Staff Meetings", sectionId: "staff", sectionTitle: "Staffing" },
      // Care & Support
      { id: "care-plans", title: "Planning & Risk Assessment", sectionId: "care-planning", sectionTitle: "Care & Support" },
      { id: "service-user-docs", title: "Service User Documents", sectionId: "care-planning", sectionTitle: "Care & Support" },
      { id: "medication", title: "Medication Management", sectionId: "care-planning", sectionTitle: "Care & Support" },
      { id: "care-notes", title: "Care & Support Notes", sectionId: "care-planning", sectionTitle: "Care & Support" },
      { id: "call-monitoring", title: "Call Monitoring", sectionId: "care-planning", sectionTitle: "Care & Support" },
      // Safety
      { id: "incidents-accidents", title: "Incidents, Accidents & Safeguarding", sectionId: "safety", sectionTitle: "Safety" },
      { id: "risk-register", title: "Risk Management", sectionId: "safety", sectionTitle: "Safety" },
      { id: "infection-control", title: "Infection Control", sectionId: "safety", sectionTitle: "Safety" },
      { id: "transportation", title: "Transportation", sectionId: "safety", sectionTitle: "Safety" },
      // Continuous Improvement
      { id: "feedback", title: "Feedback", sectionId: "continuous-improvement", sectionTitle: "Continuous Improvement" },
      { id: "audits", title: "Audits", sectionId: "continuous-improvement", sectionTitle: "Continuous Improvement" },
      { id: "stakeholders-social-community", title: "Stakeholders, Social & Community", sectionId: "continuous-improvement", sectionTitle: "Continuous Improvement" },
      { id: "achievements-learning", title: "Achievements & Challenges", sectionId: "continuous-improvement", sectionTitle: "Continuous Improvement" },
      // Supported Housing
      { id: "tenancy-benefits", title: "Tenancy & Benefits", sectionId: "supported-housing", sectionTitle: "Supported Housing" },
      { id: "property-safety-maintenance", title: "Property Safety & Maintenance", sectionId: "supported-housing", sectionTitle: "Supported Housing" },
      { id: "accommodation-suitability", title: "Compatibility Assessment", sectionId: "supported-housing", sectionTitle: "Supported Housing" },
    ];
    setSectionItems(items);
  }, []);

  // Load tag configuration
  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;
      
      setLoading(true);
      try {
        const { data: tagConfigs } = await supabase
          .from('service_subsection_tags')
          .select('*');

        if (tagConfigs) {
          const tagsMap: Record<string, string[]> = {};
          tagConfigs.forEach((config) => {
            const key = `${config.service}_${config.section_id}_${config.item_id}`;
            const tags = Array.isArray(config.tags) ? (config.tags as string[]) : [];
            tagsMap[key] = tags;
          });
          setServiceTags(tagsMap);
        }
      } catch (error) {
        console.error("Error loading service tags data:", error);
        toast({
          title: "Error",
          description: "Failed to load service tags data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile]);

  const toggleSection = (serviceSection: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [serviceSection]: !prev[serviceSection],
    }));
  };

  const toggleItem = (itemKey: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const addTag = (service: string, sectionId: string, itemId: string) => {
    const key = `${service}_${sectionId}_${itemId}`;
    const inputKey = key;
    const newTag = newTagInput[inputKey]?.trim();
    
    if (!newTag) return;

    setServiceTags((prev) => {
      const current = prev[key] || [];
      if (current.includes(newTag)) {
        toast({
          title: "Tag exists",
          description: "This tag already exists",
          variant: "destructive",
        });
        return prev;
      }
      return {
        ...prev,
        [key]: [...current, newTag],
      };
    });

    setNewTagInput((prev) => ({
      ...prev,
      [inputKey]: "",
    }));
  };

  const removeTag = (service: string, sectionId: string, itemId: string, tagToRemove: string) => {
    const key = `${service}_${sectionId}_${itemId}`;
    setServiceTags((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSave = async (service: string, sectionId: string, itemId: string) => {
    const key = `${service}_${sectionId}_${itemId}`;
    const tags = serviceTags[key] || [];

    try {
      const { error } = await supabase
        .from('service_subsection_tags')
        .upsert({
          service,
          section_id: sectionId,
          item_id: itemId,
          tags,
          updated_by: profile?.user_id,
        }, {
          onConflict: 'service,section_id,item_id'
        });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Tag configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving tags:", error);
      toast({
        title: "Error",
        description: "Failed to save tag configuration",
        variant: "destructive",
      });
    }
  };

  const groupBySection = (items: SectionItem[]) => {
    const groups: Record<string, SectionItem[]> = {};
    items.forEach((item) => {
      if (!groups[item.sectionId]) {
        groups[item.sectionId] = [];
      }
      groups[item.sectionId].push(item);
    });
    return groups;
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  const groupedItems = groupBySection(sectionItems);
  const mainServices = selectedServices.filter(s => !s.startsWith('  -'));

  if (mainServices.length === 0) {
    return (
      <Card style={{ backgroundColor: '#EAEBEC' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Service Tags Configuration
          </CardTitle>
          <CardDescription>
            Please select services in the settings above to configure tags
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: '#EAEBEC' }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tags className="w-5 h-5" />
            <CardTitle>Service Tags Configuration</CardTitle>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-[280px] bg-white">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50 max-h-[300px] overflow-y-auto">
                {mainServices.map((service) => (
                  <SelectItem key={service} value={service} className="bg-white hover:bg-gray-100">
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          Configure which tags display for each dashboard subsection based on selected services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedService && Object.entries(groupedItems).map(([sectionId, items]) => {
          const sectionTitle = items[0]?.sectionTitle || sectionId;
          const serviceSectionKey = `${selectedService}_${sectionId}`;
          return (
            <Collapsible
              key={sectionId}
              open={expandedSections[serviceSectionKey]}
              onOpenChange={() => toggleSection(serviceSectionKey)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg hover:bg-gray-50">
                <span className="font-semibold">{sectionTitle}</span>
                {expandedSections[serviceSectionKey] ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {items.map((item) => {
                  const itemKey = `${selectedService}_${item.sectionId}_${item.id}`;
                  const tagsKey = `${selectedService}_${item.sectionId}_${item.id}`;
                  const tags = serviceTags[tagsKey] || [];
                  const inputKey = itemKey;
                  return (
                    <Collapsible
                      key={item.id}
                      open={expandedItems[itemKey]}
                      onOpenChange={() => toggleItem(itemKey)}
                    >
                      <div className="ml-4 bg-white rounded-lg border">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.title}</span>
                              {tags.length > 0 && (
                                <Badge variant="secondary">{tags.length} tags</Badge>
                              )}
                            </div>
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {tags.slice(0, 5).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {tags.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{tags.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          {expandedItems[itemKey] ? (
                            <ChevronUp className="w-4 h-4 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
                          )}
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="mt-2 ml-8 p-4 bg-white rounded-lg border">
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add new tag..."
                              value={newTagInput[inputKey] || ""}
                              onChange={(e) =>
                                setNewTagInput((prev) => ({
                                  ...prev,
                                  [inputKey]: e.target.value,
                                }))
                              }
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addTag(selectedService, item.sectionId, item.id);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => addTag(selectedService, item.sectionId, item.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              >
                                {tag}
                                <X
                                  className="w-3 h-3"
                                  onClick={() => removeTag(selectedService, item.sectionId, item.id, tag)}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex justify-end pt-2 border-t">
                            <Button
                              size="sm"
                              onClick={() => handleSave(selectedService, item.sectionId, item.id)}
                            >
                              Save Configuration
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};