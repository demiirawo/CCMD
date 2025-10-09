import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Loader2 } from "lucide-react";
import { getAllEvidenceItems, getLinkedEvidenceDetails, updateEvidenceResponse, EvidenceItem } from "@/utils/evidenceLinkage";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface EvidenceLinkageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subsectionTitle: string;
  linkedEvidenceRefs: string[];
  onSave: (refs: string[]) => void;
  isSuperAdmin: boolean;
}

type StatusType = 'green' | 'amber' | 'red' | 'na';

export const EvidenceLinkageDialog = ({
  isOpen,
  onClose,
  subsectionTitle,
  linkedEvidenceRefs,
  onSave,
  isSuperAdmin
}: EvidenceLinkageDialogProps) => {
  const { profile } = useAuth();
  const [allEvidence, setAllEvidence] = useState<EvidenceItem[]>([]);
  const [linkedEvidence, setLinkedEvidence] = useState<EvidenceItem[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<string[]>(linkedEvidenceRefs);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['CQC', 'HO', 'OFT']));
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && profile?.company_id) {
      console.log('Dialog opened with linked refs:', linkedEvidenceRefs);
      loadEvidenceData();
      setSelectedRefs(linkedEvidenceRefs);
    }
  }, [isOpen, profile?.company_id, linkedEvidenceRefs]);

  const loadEvidenceData = async () => {
    if (!profile?.company_id) return;
    
    setLoading(true);
    try {
      const all = await getAllEvidenceItems(profile.company_id);
      console.log('Loaded evidence items:', all.length, all);
      setAllEvidence(all);
      
      if (!isSuperAdmin) {
        const linked = await getLinkedEvidenceDetails(linkedEvidenceRefs, profile.company_id);
        console.log('Loaded linked evidence:', linked.length, linked);
        setLinkedEvidence(linked);
      }
    } catch (error) {
      console.error('Error loading evidence:', error);
      toast.error('Failed to load evidence items');
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const handleToggleEvidence = (refId: string) => {
    console.log('Toggling evidence:', refId);
    setSelectedRefs(prev => {
      const newRefs = prev.includes(refId) 
        ? prev.filter(r => r !== refId)
        : [...prev, refId];
      console.log('Previous refs:', prev, 'New refs:', newRefs);
      return newRefs;
    });
  };

  const handleSaveConfiguration = () => {
    console.log('Saving configuration with refs:', selectedRefs);
    onSave(selectedRefs);
    toast.success('Evidence linkage saved');
    onClose();
  };

  const handleUpdateStatus = async (evidenceId: string, currentStatus: StatusType) => {
    if (!profile?.company_id) return;
    
    const statusOrder: StatusType[] = ['green', 'amber', 'red', 'na'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    const success = await updateEvidenceResponse(evidenceId, profile.company_id, 'status', newStatus);
    if (success) {
      // Update local state
      setLinkedEvidence(prev => 
        prev.map(ev => ev.id === evidenceId ? { ...ev, status: newStatus } : ev)
      );
      toast.success('Status updated');
    } else {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateComment = async (evidenceId: string, comment: string) => {
    if (!profile?.company_id) return;
    
    const success = await updateEvidenceResponse(evidenceId, profile.company_id, 'comment', comment);
    if (success) {
      // Update local state
      setLinkedEvidence(prev => 
        prev.map(ev => ev.id === evidenceId ? { ...ev, comment } : ev)
      );
    }
  };

  const filterEvidence = (items: EvidenceItem[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.referenceId.toLowerCase().includes(query) ||
      item.evidenceText.toLowerCase().includes(query) ||
      item.categoryName.toLowerCase().includes(query)
    );
  };

  const groupByType = (items: EvidenceItem[]) => {
    const grouped: { [key: string]: EvidenceItem[] } = {
      CQC: [],
      HO: [],
      OFT: []
    };
    items.forEach(item => {
      grouped[item.complianceType].push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Super Admin Mode
  if (isSuperAdmin) {
    const filteredAll = filterEvidence(allEvidence);
    const grouped = groupByType(filteredAll);
    const currentlyLinked = allEvidence.filter(ev => selectedRefs.includes(ev.referenceId));

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Configure Evidence Links - {subsectionTitle}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by reference ID, evidence text, or category..."
                className="pl-10 bg-white"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-sm font-semibold text-blue-900">
                Selected: {selectedRefs.length} items
              </p>
              {selectedRefs.length > 0 && (
                <p className="text-xs text-blue-700 mt-1 max-h-12 overflow-y-auto">
                  {selectedRefs.join(', ')}
                </p>
              )}
            </div>

            {currentlyLinked.length > 0 && (
              <div className="border rounded-lg p-2 bg-muted/50">
                <h3 className="font-semibold text-sm mb-1">Currently Linked ({currentlyLinked.length})</h3>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {currentlyLinked.map(ev => (
                    <div key={ev.id} className="text-sm flex items-start gap-2">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleToggleEvidence(ev.referenceId)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-semibold text-xs mb-0.5">{ev.referenceId}</div>
                        <div className="text-xs text-muted-foreground">
                          {ev.panelName} &gt; {ev.categoryName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(['CQC', 'HO', 'OFT'] as const).map(type => {
                const typeLabel = type === 'HO' ? 'Home Office' : type === 'OFT' ? 'Ofsted' : type;
                const typeEvidence = grouped[type];
                
                if (typeEvidence.length === 0) return null;

                return (
                  <Collapsible
                    key={type}
                    open={expandedTypes.has(type)}
                    onOpenChange={() => toggleType(type)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        {expandedTypes.has(type) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-semibold text-sm">{typeLabel} Evidence ({typeEvidence.length})</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-6 pt-2 space-y-2">
                        {typeEvidence.map(ev => (
                          <div key={ev.id} className="flex items-start gap-2 p-2 hover:bg-muted/20 rounded">
                            <Checkbox
                              checked={selectedRefs.includes(ev.referenceId)}
                              onCheckedChange={() => handleToggleEvidence(ev.referenceId)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="mb-1">
                                <span className="font-mono font-semibold text-sm">{ev.referenceId}</span>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {ev.panelName} &gt; {ev.categoryName}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {ev.evidenceText || 'No evidence text'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-3 border-t flex-shrink-0 mt-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSaveConfiguration}>
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Regular User Mode
  const filteredLinked = filterEvidence(linkedEvidence);
  
  // Group by panel and category
  const groupedByPanel: { [key: string]: { [key: string]: EvidenceItem[] } } = {};
  filteredLinked.forEach(item => {
    if (!groupedByPanel[item.panelName]) {
      groupedByPanel[item.panelName] = {};
    }
    if (!groupedByPanel[item.panelName][item.categoryName]) {
      groupedByPanel[item.panelName][item.categoryName] = [];
    }
    groupedByPanel[item.panelName][item.categoryName].push(item);
  });

  // Initialize expanded panels when data loads
  useEffect(() => {
    if (Object.keys(groupedByPanel).length > 0 && expandedPanels.size === 0) {
      setExpandedPanels(new Set(Object.keys(groupedByPanel)));
    }
  }, [groupedByPanel]);

  const togglePanel = (panelName: string) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(panelName)) {
      newExpanded.delete(panelName);
    } else {
      newExpanded.add(panelName);
    }
    setExpandedPanels(newExpanded);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Evidence Items - {subsectionTitle}</DialogTitle>
        </DialogHeader>

        {linkedEvidence.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No evidence items linked to this subsection yet.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3">
            {Object.keys(groupedByPanel).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(groupedByPanel).map(([panelName, categories]) => (
                  <Collapsible
                    key={panelName}
                    open={expandedPanels.has(panelName)}
                    onOpenChange={() => togglePanel(panelName)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg hover:bg-primary/15 transition-colors">
                        {expandedPanels.has(panelName) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <span className="font-semibold text-base">{panelName}</span>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {Object.values(categories).flat().length} items
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-2 pt-2 space-y-4">
                        {Object.entries(categories).map(([categoryName, items]) => (
                          <div key={categoryName} className="space-y-2">
                            <div className="font-medium text-sm text-muted-foreground pl-4 pt-2">
                              {categoryName}
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                              <div className="grid grid-cols-[90px_1.5fr_1.5fr_100px] gap-3 p-2 bg-muted font-semibold text-xs border-b sticky top-0">
                                <div>Ref ID</div>
                                <div>Evidence</div>
                                <div>Comment</div>
                                <div>Status</div>
                              </div>
                              {items.map(ev => (
                                <div key={ev.id} className="grid grid-cols-[90px_1.5fr_1.5fr_100px] gap-3 p-2 border-b last:border-b-0 items-start">
                                  <div className="font-mono font-semibold text-xs pt-2">
                                    {ev.referenceId}
                                  </div>
                                  <div className="text-xs p-2 bg-muted/30 rounded max-h-20 overflow-y-auto">
                                    {ev.evidenceText || 'No evidence provided'}
                                  </div>
                                  <div>
                                    <Textarea
                                      value={ev.comment}
                                      onChange={(e) => handleUpdateComment(ev.id, e.target.value)}
                                      placeholder="Enter comment..."
                                      className="text-xs min-h-[60px] max-h-20 bg-white"
                                    />
                                  </div>
                                  <div className="flex justify-center pt-2">
                                    <StatusBadge
                                      status={ev.status as StatusType}
                                      onClick={() => handleUpdateStatus(ev.id, ev.status as StatusType)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No evidence items match your search.
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t flex-shrink-0 mt-3">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
