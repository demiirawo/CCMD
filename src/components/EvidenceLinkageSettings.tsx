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
import { EvidenceItem, getAllEvidenceItems } from "@/utils/evidenceLinkage";

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
      // Staffing
      { id: "recruitment", title: "Capacity", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "staff-documents", title: "Staff Documents", sectionId: "staff", sectionTitle: "Staffing" },
      { id: "training", title: "Training", sectionId: "staff", sectionTitle: "Staffing" },
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
      { id: "achievements-learning", title: "Achievements & Challenges", sectionId: "continuous-improvement", sectionTitle: "Continuous Improvement" },
      // Supported Housing
      { id: "tenancy-benefits", title: "Tenancy & Benefits", sectionId: "supported-housing", sectionTitle: "Supported Housing" },
      { id: "property-safety-maintenance", title: "Property Safety & Maintenance", sectionId: "supported-housing", sectionTitle: "Supported Housing" },
      { id: "accommodation-suitability", title: "Compatibility Assessment", sectionId: "supported-housing", sectionTitle: "Supported Housing" },
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
        const evidence = await getAllEvidenceItems(companyId);
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

    console.log("💾 Saving evidence linkage:", { sectionId, itemId, refs, profileUserId: profile?.user_id });

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

      if (error) {
        console.error("❌ Error saving evidence linkage:", error);
        throw error;
      }

      console.log("✅ Evidence linkage saved successfully");
      toast({
        title: "Saved",
        description: "Evidence linkage configuration saved successfully",
      });
    } catch (error) {
      console.error("❌ Exception in handleSave:", error);
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
                      <div className="ml-4 bg-white rounded-lg border">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.title}</span>
                              {linkedCount > 0 && (
                                <Badge variant="secondary">{linkedCount} linked</Badge>
                              )}
                            </div>
                            {linkedCount > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {selectedEvidence[itemKey]?.slice(0, 10).map((refId) => (
                                  <Badge key={refId} variant="outline" className="text-xs">
                                    {refId}
                                  </Badge>
                                ))}
                                {linkedCount > 10 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{linkedCount - 10} more
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
                              onClick={() => {
                                console.log("🔘 Save Configuration button clicked for:", { sectionId: item.sectionId, itemId: item.id });
                                handleSave(item.sectionId, item.id);
                              }}
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
