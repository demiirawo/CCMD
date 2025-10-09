import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, Search, Link } from "lucide-react";
import { EvidenceItem, loadAllEvidence } from "@/utils/evidenceLinkage";

interface EvidenceLinkageSettingsProps {
  companyId: string;
}

interface SectionItem {
  id: string;
  title: string;
  sectionId: string;
  sectionTitle: string;
}

export const EvidenceLinkageSettings = ({ companyId }: EvidenceLinkageSettingsProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [allEvidence, setAllEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [selectedEvidence, setSelectedEvidence] = useState<Record<string, string[]>>({});
  const [sectionItems, setSectionItems] = useState<SectionItem[]>([]);

  // Load all subsections from the dashboard structure
  useEffect(() => {
    const items: SectionItem[] = [
      // Meeting Overview
      { id: "meeting-date", title: "Meeting Date", sectionId: "meeting-overview", sectionTitle: "Meeting Overview" },
      { id: "meeting-attendees", title: "Meeting Attendees", sectionId: "meeting-overview", sectionTitle: "Meeting Overview" },
      { id: "meeting-purpose", title: "Meeting Purpose", sectionId: "meeting-overview", sectionTitle: "Meeting Overview" },
      // Staffing
      { id: "recruitment", title: "Capacity", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "staff-documents", title: "Staff Documents", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "training", title: "Training", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "supervision", title: "Supervision", sectionId: "staff", sectionTitle: "Staffing" },
      // Service Users
      { id: "people-profile", title: "People We Support Profiles", sectionId: "service-users", sectionTitle: "Service Users" },
      { id: "care-plans", title: "Care Plans", sectionId: "service-users", sectionTitle: "Service Users" },
      { id: "risk-assessments", title: "Risk Assessments", sectionId: "service-users", sectionTitle: "Service Users" },
      { id: "activity-engagement", title: "Activity & Engagement", sectionId: "service-users", sectionTitle: "Service Users" },
      { id: "emotional-wellbeing", title: "Emotional Wellbeing", sectionId: "service-users", sectionTitle: "Service Users" },
      { id: "health", title: "Health", sectionId: "service-users", sectionTitle: "Service Users" },
      { id: "medication", title: "Medication", sectionId: "service-users", sectionTitle: "Service Users" },
      { id: "care-notes", title: "Care Notes", sectionId: "service-users", sectionTitle: "Service Users" },
      // Quality & Compliance
      { id: "spot-checks", title: "Spot Checks", sectionId: "quality", sectionTitle: "Quality & Compliance" },
      { id: "safeguarding", title: "Safeguarding", sectionId: "quality", sectionTitle: "Quality & Compliance" },
      { id: "incidents", title: "Incidents", sectionId: "quality", sectionTitle: "Quality & Compliance" },
      { id: "complaints", title: "Complaints", sectionId: "quality", sectionTitle: "Quality & Compliance" },
      { id: "feedback", title: "Feedback", sectionId: "quality", sectionTitle: "Quality & Compliance" },
      { id: "policies", title: "Policies & Procedures", sectionId: "quality", sectionTitle: "Quality & Compliance" },
    ];
    setSectionItems(items);
  }, []);

  // Load evidence and linkage data
  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;
      
      setLoading(true);
      try {
        // Load all evidence
        const evidence = await loadAllEvidence(profile, companyId);
        setAllEvidence(evidence);

        // Load existing global linkages
        const { data: linkages } = await supabase
          .from('global_subsection_evidence')
          .select('*');

        if (linkages) {
          const evidenceMap: Record<string, string[]> = {};
          linkages.forEach((linkage) => {
            const key = `${linkage.section_id}_${linkage.item_id}`;
            const refs = linkage.linked_evidence_refs;
            // Ensure refs is an array of strings
            if (Array.isArray(refs)) {
              evidenceMap[key] = refs as string[];
            } else {
              evidenceMap[key] = [];
            }
          });
          setSelectedEvidence(evidenceMap);
        }
      } catch (error) {
        console.error("Error loading evidence linkage data:", error);
        toast({
          title: "Error",
          description: "Failed to load evidence linkage data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile, companyId]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleItem = (itemKey: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const handleEvidenceToggle = (sectionId: string, itemId: string, evidenceRef: string) => {
    const key = `${sectionId}_${itemId}`;
    setSelectedEvidence((prev) => {
      const current = prev[key] || [];
      const isSelected = current.includes(evidenceRef);
      return {
        ...prev,
        [key]: isSelected
          ? current.filter((ref) => ref !== evidenceRef)
          : [...current, evidenceRef],
      };
    });
  };

  const handleSave = async (sectionId: string, itemId: string) => {
    const key = `${sectionId}_${itemId}`;
    const refs = selectedEvidence[key] || [];

    try {
      const { error } = await supabase
        .from('global_subsection_evidence')
        .upsert({
          section_id: sectionId,
          item_id: itemId,
          linked_evidence_refs: refs,
          updated_by: profile?.user_id,
        }, {
          onConflict: 'section_id,item_id'
        });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Evidence linkage configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving evidence linkage:", error);
      toast({
        title: "Error",
        description: "Failed to save evidence linkage configuration",
        variant: "destructive",
      });
    }
  };

  const filterEvidence = (evidence: EvidenceItem[], query: string): EvidenceItem[] => {
    if (!query) return evidence;
    const lowerQuery = query.toLowerCase();
    return evidence.filter(
      (item) =>
        item.referenceId.toLowerCase().includes(lowerQuery) ||
        item.evidenceText.toLowerCase().includes(lowerQuery)
    );
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
  const filteredEvidence = filterEvidence(allEvidence, searchQuery);

  return (
    <Card style={{ backgroundColor: '#EAEBEC' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Evidence Linkage Configuration
        </CardTitle>
        <CardDescription>
          Configure which inspection evidence items are linked to each dashboard subsection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedItems).map(([sectionId, items]) => {
          const sectionTitle = items[0]?.sectionTitle || sectionId;
          return (
            <Collapsible
              key={sectionId}
              open={expandedSections[sectionId]}
              onOpenChange={() => toggleSection(sectionId)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg hover:bg-gray-50">
                <span className="font-semibold">{sectionTitle}</span>
                {expandedSections[sectionId] ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {items.map((item) => {
                  const itemKey = `${item.sectionId}_${item.id}`;
                  const linkedCount = selectedEvidence[itemKey]?.length || 0;
                  return (
                    <Collapsible
                      key={item.id}
                      open={expandedItems[itemKey]}
                      onOpenChange={() => toggleItem(itemKey)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 ml-4 bg-white rounded-lg hover:bg-gray-50 border">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.title}</span>
                          {linkedCount > 0 && (
                            <Badge variant="secondary">{linkedCount} linked</Badge>
                          )}
                        </div>
                        {expandedItems[itemKey] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 ml-8 p-4 bg-white rounded-lg border">
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search evidence..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {filteredEvidence.map((evidence) => {
                              const isSelected = selectedEvidence[itemKey]?.includes(evidence.referenceId) || false;
                              return (
                                <div
                                  key={evidence.referenceId}
                                  className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded"
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handleEvidenceToggle(item.sectionId, item.id, evidence.referenceId)
                                    }
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{evidence.referenceId}</div>
                                    <div className="text-xs text-muted-foreground">{evidence.panelName} &gt; {evidence.categoryName}</div>
                                    <div className="text-sm mt-1">{evidence.evidenceText}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-end pt-2 border-t">
                            <Button
                              size="sm"
                              onClick={() => handleSave(item.sectionId, item.id)}
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
