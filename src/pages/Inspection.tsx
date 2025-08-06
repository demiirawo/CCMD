import { Navigation } from "@/components/Navigation";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useInspectionData } from "@/hooks/useInspectionData";
import { StatusBadge } from "@/components/StatusBadge";

type StatusType = 'green' | 'amber' | 'red' | 'na';

const AutoExpandTextarea = ({ value, onChange, placeholder, className }: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder: string; 
  className: string; 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      style={{ minHeight: '60px', resize: 'none', overflow: 'hidden' }}
    />
  );
};

const Inspection = () => {
  const { 
    panels, 
    categories, 
    evidence, 
    responses, 
    loading, 
    isSuperAdmin, 
    addCategory, 
    updateCategory, 
    addEvidence, 
    updateEvidence, 
    updateResponse 
  } = useInspectionData();

  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

  const togglePanel = (panelId: string) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(panelId)) {
      newExpanded.delete(panelId);
    } else {
      newExpanded.add(panelId);
    }
    setExpandedPanels(newExpanded);
  };

  const handleAddCategory = async (panelId: string) => {
    await addCategory(panelId, "New Category");
  };

  const handleAddEvidence = async (categoryId: string) => {
    await addEvidence(categoryId, "");
  };

  const getResponseForEvidence = (evidenceId: string) => {
    return responses.find(r => r.evidence_id === evidenceId);
  };

  const getCategoriesForPanel = (panelId: string) => {
    return categories.filter(cat => cat.panel_id === panelId);
  };

  const getEvidenceForCategory = (categoryId: string) => {
    return evidence.filter(ev => ev.category_id === categoryId);
  };

  const getCategoryLastUpdated = (categoryId: string) => {
    const categoryEvidence = evidence.filter(ev => ev.category_id === categoryId);
    const categoryResponses = responses.filter(r => 
      categoryEvidence.some(ev => ev.id === r.evidence_id)
    );
    
    if (categoryResponses.length === 0) return 'No updates';
    
    const lastUpdate = Math.max(...categoryResponses.map(r => new Date(r.updated_at).getTime()));
    return new Date(lastUpdate).toLocaleDateString();
  };

  const getCategoryStatus = (categoryId: string): StatusType => {
    const categoryEvidence = evidence.filter(ev => ev.category_id === categoryId);
    const categoryResponses = responses.filter(r => 
      categoryEvidence.some(ev => ev.id === r.evidence_id)
    );
    
    if (categoryResponses.length === 0) return 'green';
    
    const statuses = categoryResponses.map(r => r.status as StatusType);
    
    // If any evidence is red, category is red
    if (statuses.includes('red')) return 'red';
    // If any evidence is amber, category is amber
    if (statuses.includes('amber')) return 'amber';
    // Otherwise, category is green
    return 'green';
  };

  const cycleStatus = (currentStatus: StatusType): StatusType => {
    const statusOrder: StatusType[] = ['green', 'amber', 'red', 'na'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    return statusOrder[nextIndex];
  };

  const handleStatusClick = (evidenceId: string, currentStatus: StatusType) => {
    const newStatus = cycleStatus(currentStatus);
    updateResponse(evidenceId, 'status', newStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">Loading inspection data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            {panels.map((panel) => (
              <div key={panel.id} className="bg-green-600 text-white rounded-lg overflow-hidden">
                <div 
                  className="p-6 flex items-center justify-between hover:bg-green-700 transition-colors cursor-pointer"
                  onClick={() => togglePanel(panel.id)}
                >
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-1">{panel.name}</h2>
                    <p className="text-green-100 text-sm">Updated: {new Date(panel.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {expandedPanels.has(panel.id) ? (
                      <ChevronDown className="h-6 w-6 text-white/80" />
                    ) : (
                      <ChevronRight className="h-6 w-6 text-white/80" />
                    )}
                  </div>
                </div>

                {expandedPanels.has(panel.id) && (
                  <div className="bg-white text-black p-6">
                    {isSuperAdmin && (
                      <div className="mb-4">
                        <Button 
                          onClick={() => handleAddCategory(panel.id)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Category
                        </Button>
                      </div>
                    )}

                    {getCategoriesForPanel(panel.id).length > 0 && (
                      <div className="space-y-6">
                        {getCategoriesForPanel(panel.id).map((category) => (
                          <Card key={category.id} className="p-4">
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                 <div className="flex items-center gap-4">
                                   {isSuperAdmin ? (
                                     <Input
                                       value={category.name}
                                       onChange={(e) => updateCategory(category.id, e.target.value)}
                                       className="font-medium text-lg max-w-md"
                                       placeholder="Category name..."
                                     />
                                   ) : (
                                     <h3 className="font-medium text-lg">{category.name}</h3>
                                   )}
                                   <StatusBadge status={getCategoryStatus(category.id)} />
                                   <span className="text-sm text-muted-foreground">
                                     Last updated: {getCategoryLastUpdated(category.id)}
                                   </span>
                                 </div>
                                {isSuperAdmin && (
                                  <Button 
                                    onClick={() => handleAddEvidence(category.id)}
                                    size="sm"
                                    className="flex items-center gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add Evidence
                                  </Button>
                                )}
                              </div>
                            </div>

                            {getEvidenceForCategory(category.id).length > 0 && (
                              <div className="space-y-2">
                                {/* Grid Header */}
                                <div className="grid gap-4 font-semibold border-b pb-2 text-sm" style={{gridTemplateColumns: '2fr 2fr 100px'}}>
                                  <div>Evidence</div>
                                  <div>Comment</div>
                                  <div>Status</div>
                                </div>

                                {/* Evidence Rows */}
                                {getEvidenceForCategory(category.id).map((evidenceItem) => {
                                  const response = getResponseForEvidence(evidenceItem.id);
                                  return (
                                    <div key={evidenceItem.id} className="grid gap-4 items-start py-2 border-b border-gray-100" style={{gridTemplateColumns: '2fr 2fr 100px'}}>
                                      <div>
                                        {isSuperAdmin ? (
                                          <AutoExpandTextarea
                                            value={evidenceItem.evidence_text}
                                            onChange={(e) => updateEvidence(evidenceItem.id, e.target.value)}
                                            placeholder="Enter evidence..."
                                            className="text-sm"
                                          />
                                        ) : (
                                          <div className="text-sm p-2 bg-gray-50 rounded">
                                            {evidenceItem.evidence_text || "No evidence provided"}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <AutoExpandTextarea
                                          value={response?.comment || ''}
                                          onChange={(e) => updateResponse(evidenceItem.id, 'comment', e.target.value)}
                                          placeholder="Enter comment..."
                                          className="text-sm"
                                        />
                                      </div>
                                       <div className="flex justify-center">
                                         <StatusBadge 
                                           status={(response?.status || 'green') as StatusType}
                                           onClick={() => handleStatusClick(evidenceItem.id, (response?.status || 'green') as StatusType)}
                                         />
                                       </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {getEvidenceForCategory(category.id).length === 0 && (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                {isSuperAdmin ? "No evidence added yet. Click 'Add Evidence' to get started." : "No evidence available for this category."}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}

                    {getCategoriesForPanel(panel.id).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {isSuperAdmin ? "No categories added yet. Click 'Add Category' to get started." : "No categories available for this panel."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Inspection;