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
import { ChevronDown, ChevronUp, Plus, X, Tags, GripVertical } from "lucide-react";
import { COMPLIANCE_OPTIONS } from "@/constants/services";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ServiceTagsSettingsProps {
  companyId: string;
}

interface SectionItem {
  id: string;
  title: string;
  sectionId: string;
  sectionTitle: string;
}

interface SortableTagProps {
  tag: string;
  onRemove: () => void;
}

const SortableTag = ({ tag, onRemove }: SortableTagProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-tag rounded-md hover:bg-tag/90"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-tag-foreground/60" />
      </div>
      <span className="flex-1 text-sm text-tag-foreground">{tag}</span>
      <button
        onClick={onRemove}
        className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors text-tag-foreground/60 hover:text-destructive-foreground"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export const ServiceTagsSettings = ({ companyId }: ServiceTagsSettingsProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [serviceTags, setServiceTags] = useState<Record<string, string[]>>({});
  const [newTagInput, setNewTagInput] = useState<Record<string, string>>({});
  const [sectionItems, setSectionItems] = useState<SectionItem[]>([]);

  // Set first compliance option as default when component mounts
  useEffect(() => {
    if (COMPLIANCE_OPTIONS.length > 0 && !selectedService) {
      setSelectedService(COMPLIANCE_OPTIONS[0]);
    }
  }, [selectedService]);

  // Load all subsections from the dashboard structure
  useEffect(() => {
    const items: SectionItem[] = [
      // Staffing
      { id: "recruitment", title: "Safe and Effective Staffing Levels", sectionId: "staff", sectionTitle: "Staffing" },
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

  const addTag = async (service: string, sectionId: string, itemId: string) => {
    const key = `${service}_${sectionId}_${itemId}`;
    const inputKey = key;
    const newTag = newTagInput[inputKey]?.trim();
    
    if (!newTag) return;

    const current = serviceTags[key] || [];
    if (current.includes(newTag)) {
      toast({
        title: "Tag exists",
        description: "This tag already exists",
        variant: "destructive",
      });
      return;
    }

    const updatedTags = [...current, newTag];
    
    setServiceTags((prev) => ({
      ...prev,
      [key]: updatedTags,
    }));

    setNewTagInput((prev) => ({
      ...prev,
      [inputKey]: "",
    }));

    // Auto-save
    try {
      const { error } = await supabase
        .from('service_subsection_tags')
        .upsert({
          service,
          section_id: sectionId,
          item_id: itemId,
          tags: updatedTags,
          updated_by: profile?.user_id,
        }, {
          onConflict: 'service,section_id,item_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving tags:", error);
      toast({
        title: "Error",
        description: "Failed to save tags",
        variant: "destructive",
      });
    }
  };

  const removeTag = async (service: string, sectionId: string, itemId: string, tagToRemove: string) => {
    const key = `${service}_${sectionId}_${itemId}`;
    const updatedTags = (serviceTags[key] || []).filter((tag) => tag !== tagToRemove);
    
    setServiceTags((prev) => ({
      ...prev,
      [key]: updatedTags,
    }));

    // Auto-save
    try {
      const { error } = await supabase
        .from('service_subsection_tags')
        .upsert({
          service,
          section_id: sectionId,
          item_id: itemId,
          tags: updatedTags,
          updated_by: profile?.user_id,
        }, {
          onConflict: 'service,section_id,item_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving tags:", error);
      toast({
        title: "Error",
        description: "Failed to save tags",
        variant: "destructive",
      });
    }
  };

  const reorderTags = async (service: string, sectionId: string, itemId: string, reorderedTags: string[]) => {
    const key = `${service}_${sectionId}_${itemId}`;
    
    setServiceTags((prev) => ({
      ...prev,
      [key]: reorderedTags,
    }));

    // Auto-save
    try {
      const { error } = await supabase
        .from('service_subsection_tags')
        .upsert({
          service,
          section_id: sectionId,
          item_id: itemId,
          tags: reorderedTags,
          updated_by: profile?.user_id,
        }, {
          onConflict: 'service,section_id,item_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving tag order:", error);
      toast({
        title: "Error",
        description: "Failed to save tag order",
        variant: "destructive",
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


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

  return (
    <Card style={{ backgroundColor: '#EAEBEC' }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tags className="w-5 h-5" />
            <CardTitle>Service Tags Configuration</CardTitle>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-[380px] bg-white">
                <SelectValue placeholder="Select a compliance option" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50 max-h-[300px] overflow-y-auto">
                {COMPLIANCE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="bg-white hover:bg-gray-100">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          Configure which tags display for each dashboard subsection based on selected compliance option
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.title}</span>
                            {tags.length > 0 && (
                              <Badge variant="secondary">{tags.length} tags</Badge>
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
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event: DragEndEvent) => {
                              const { active, over } = event;
                              
                              if (over && active.id !== over.id) {
                                const oldIndex = tags.indexOf(active.id as string);
                                const newIndex = tags.indexOf(over.id as string);
                                const reordered = arrayMove(tags, oldIndex, newIndex);
                                reorderTags(selectedService, item.sectionId, item.id, reordered);
                              }
                            }}
                          >
                            <SortableContext items={tags} strategy={verticalListSortingStrategy}>
                              <div className="space-y-2">
                                {tags.map((tag) => (
                                  <SortableTag
                                    key={tag}
                                    tag={tag}
                                    onRemove={() => removeTag(selectedService, item.sectionId, item.id, tag)}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
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