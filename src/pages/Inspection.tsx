import { Navigation } from "@/components/Navigation";
import { ChevronRight, ChevronDown, Plus, Trash2, GripVertical } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useInspectionData } from "@/hooks/useInspectionData";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { MeetingStatusSummary } from "@/components/MeetingStatusSummary";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
type StatusType = 'green' | 'amber' | 'red' | 'na';

// Sortable category component
const SortableCategory = ({
  category,
  isExpanded,
  onToggle,
  onUpdateCategory,
  onAddEvidence,
  onDeleteCategory,
  getEvidenceForCategory,
  getResponseForEvidence,
  getCategoryStatus,
  getCategoryLastUpdated,
  updateEvidence,
  updateResponse,
  deleteEvidence,
  handleStatusClick,
  isSuperAdmin
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: category.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return <Card ref={setNodeRef} style={style} className={cn("p-4", isDragging && "opacity-50")}>
      <div className="mb-4 cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors" onClick={() => onToggle(category.id)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isSuperAdmin && <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded" onClick={e => e.stopPropagation()}>
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>}
              {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
              {isSuperAdmin ? <DebouncedInput value={category.name} onSave={value => onUpdateCategory(category.id, value)} className="font-medium text-lg max-w-md" placeholder="Category name..." /> : <h3 className="font-medium text-lg">{category.name}</h3>}
            </div>
            <StatusBadge status={getCategoryStatus(category.id)} />
            <span className="text-sm text-muted-foreground">
              Last updated: {getCategoryLastUpdated(category.id)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && <>
                <Button onClick={e => {
              e.stopPropagation();
              onAddEvidence(category.id);
            }} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Evidence
                </Button>
                <Button onClick={e => {
              e.stopPropagation();
              onDeleteCategory(category.id);
            }} size="sm" variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>}
          </div>
        </div>
      </div>

      {isExpanded && getEvidenceForCategory(category.id).length > 0 && <div className="space-y-2">
          {/* Grid Header */}
          <div className="grid gap-4 font-semibold border-b pb-2 text-sm" style={{
        gridTemplateColumns: isSuperAdmin ? '2fr 2fr 100px 60px' : '2fr 2fr 100px'
      }}>
             <div>Evidence</div>
             <div>Comment</div>
             <div>Status</div>
             {isSuperAdmin && <div></div>}
          </div>

          {/* Evidence Rows */}
          {getEvidenceForCategory(category.id).map((evidenceItem: any) => {
        const response = getResponseForEvidence(evidenceItem.id);
        return <div key={evidenceItem.id} className="grid gap-4 items-start py-2 border-b border-gray-100" style={{
          gridTemplateColumns: isSuperAdmin ? '2fr 2fr 100px 60px' : '2fr 2fr 100px'
        }}>
                 <div>
                   {isSuperAdmin ? <DebouncedTextarea value={evidenceItem.evidence_text} onSave={value => updateEvidence(evidenceItem.id, value)} placeholder="Enter evidence..." className="text-sm" /> : <div className="text-sm p-2 bg-gray-50 rounded">
                       {evidenceItem.evidence_text || "No evidence provided"}
                     </div>}
                 </div>
                 <div>
                   <DebouncedTextarea value={response?.comment || ''} onSave={value => updateResponse(evidenceItem.id, 'comment', value)} placeholder="Enter comment..." className="text-sm" />
                 </div>
                 <div className="flex justify-center">
                   <StatusBadge status={(response?.status || 'green') as StatusType} onClick={() => handleStatusClick(evidenceItem.id, (response?.status || 'green') as StatusType)} />
                 </div>
                 {isSuperAdmin && <div className="flex justify-center">
                     <Button onClick={() => deleteEvidence(evidenceItem.id)} size="sm" variant="destructive" className="h-8 w-8 p-0">
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>}
              </div>;
      })}
        </div>}

      {isExpanded && getEvidenceForCategory(category.id).length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">
          {isSuperAdmin ? "No evidence added yet. Click 'Add Evidence' to get started." : "No evidence available for this category."}
        </div>}
    </Card>;
};

// Debounced input component
const DebouncedInput = ({
  value,
  onSave,
  placeholder,
  className,
  type = "text"
}: {
  value: string;
  onSave: (value: string) => void;
  placeholder: string;
  className: string;
  type?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  const debouncedSave = useCallback((newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (newValue !== value) {
        onSave(newValue);
      }
    }, 1000); // 1 second delay
  }, [value, onSave]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSave(newValue);
  };
  return <Input value={localValue} onChange={handleChange} placeholder={placeholder} className={cn("text-lg font-bold flex items-center gap-2 text-white", className)} type={type} />;
};

// Debounced textarea component
const DebouncedTextarea = ({
  value,
  onSave,
  placeholder,
  className
}: {
  value: string;
  onSave: (value: string) => void;
  placeholder: string;
  className: string;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localValue]);
  const debouncedSave = useCallback((newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (newValue !== value) {
        onSave(newValue);
      }
    }, 1000); // 1 second delay
  }, [value, onSave]);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSave(newValue);
  };
  return <Textarea ref={textareaRef} value={localValue} onChange={handleChange} placeholder={placeholder} className={className} style={{
    minHeight: '60px',
    resize: 'none',
    overflow: 'hidden'
  }} />;
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
    updateResponse,
    deleteCategory,
    deleteEvidence,
    updatePanel
  } = useInspectionData();
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isCQCExpanded, setIsCQCExpanded] = useState(true);
  const [isCOSExpanded, setIsCOSExpanded] = useState(true);
  const [isOfstedExpanded, setIsOfstedExpanded] = useState(true);
  const [categoryOrders, setCategoryOrders] = useState<{
    [panelId: string]: string[];
  }>({});
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const togglePanel = (panelId: string) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(panelId)) {
      newExpanded.delete(panelId);
    } else {
      newExpanded.add(panelId);
    }
    setExpandedPanels(newExpanded);
  };
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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

  // Separate panels into CQC, COS, and Ofsted categories
  const cqcPanels = panels.filter(panel => panel.name !== 'COS Checklist' && !panel.name.includes('Ofsted'));
  const cosCompliancePanel = panels.find(panel => panel.name === 'COS Checklist');
  const ofstedPanels = panels.filter(panel => panel.name.includes('Ofsted'));
  const getEvidenceForCategory = (categoryId: string) => {
    return evidence.filter(ev => ev.category_id === categoryId);
  };
  const getCategoryLastUpdated = (categoryId: string) => {
    const categoryEvidence = evidence.filter(ev => ev.category_id === categoryId);
    const categoryResponses = responses.filter(r => categoryEvidence.some(ev => ev.id === r.evidence_id));
    if (categoryResponses.length === 0) return 'No updates';
    const lastUpdate = Math.max(...categoryResponses.map(r => new Date(r.updated_at).getTime()));
    return new Date(lastUpdate).toLocaleDateString();
  };
  const getPanelLastUpdated = (panelId: string) => {
    const panelCategories = categories.filter(cat => cat.panel_id === panelId);
    const panelEvidence = evidence.filter(ev => panelCategories.some(cat => cat.id === ev.category_id));
    const panelResponses = responses.filter(r => panelEvidence.some(ev => ev.id === r.evidence_id));
    if (panelResponses.length === 0) return 'No updates';
    const lastUpdate = Math.max(...panelResponses.map(r => new Date(r.updated_at).getTime()));
    return new Date(lastUpdate).toLocaleDateString();
  };
  const getCategoryStatus = (categoryId: string): StatusType => {
    const categoryEvidence = evidence.filter(ev => ev.category_id === categoryId);
    const categoryResponses = responses.filter(r => categoryEvidence.some(ev => ev.id === r.evidence_id));
    if (categoryResponses.length === 0) return 'green';
    const statuses = categoryResponses.map(r => r.status as StatusType);

    // If any evidence is red, category is red
    if (statuses.includes('red')) return 'red';
    // If any evidence is amber, category is amber
    if (statuses.includes('amber')) return 'amber';
    // Otherwise, category is green
    return 'green';
  };

  // Build sections array for RAG summary of evidence status (CQC only)
  const cqcSections = [{
    id: 'cqc-evidence',
    title: 'CQC Evidence Status',
    items: categories.filter(cat => {
      const panel = panels.find(p => p.id === cat.panel_id);
      return panel && panel.name !== 'COS Checklist' && !panel.name.includes('Ofsted');
    }).flatMap(cat => getEvidenceForCategory(cat.id)).map(evidenceItem => {
      const response = getResponseForEvidence(evidenceItem.id);
      return {
        status: (response?.status || 'green') as StatusType
      };
    })
  }];

  // Build sections array for COS Checklist evidence status
  const cosSections = [{
    id: 'cos-evidence',
    title: 'COS Checklist Evidence Status',
    items: categories.filter(cat => {
      const panel = panels.find(p => p.id === cat.panel_id);
      return panel && panel.name === 'COS Checklist';
    }).flatMap(cat => getEvidenceForCategory(cat.id)).map(evidenceItem => {
      const response = getResponseForEvidence(evidenceItem.id);
      return {
        status: (response?.status || 'green') as StatusType
      };
    })
  }];

  // Build sections array for Ofsted evidence status
  const ofstedSections = [{
    id: 'ofsted-evidence',
    title: 'Ofsted Evidence Status',
    items: categories.filter(cat => {
      const panel = panels.find(p => p.id === cat.panel_id);
      return panel && panel.name.includes('Ofsted');
    }).flatMap(cat => getEvidenceForCategory(cat.id)).map(evidenceItem => {
      const response = getResponseForEvidence(evidenceItem.id);
      return {
        status: (response?.status || 'green') as StatusType
      };
    })
  }];
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

  // Get ordered categories for a panel
  const getOrderedCategoriesForPanel = (panelId: string) => {
    const panelCategories = categories.filter(cat => cat.panel_id === panelId);
    const order = categoryOrders[panelId];
    if (!order) {
      return panelCategories;
    }

    // Sort categories based on the stored order
    return panelCategories.sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);

      // If both are in order array, use their positions
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in order array, it comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // If neither is in order array, maintain original order
      return 0;
    });
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent, panelId: string) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const panelCategories = getOrderedCategoriesForPanel(panelId);
      const categoryIds = panelCategories.map(cat => cat.id);
      const oldIndex = categoryIds.indexOf(active.id as string);
      const newIndex = categoryIds.indexOf(over.id as string);
      const newOrder = arrayMove(categoryIds, oldIndex, newIndex);
      setCategoryOrders(prev => ({
        ...prev,
        [panelId]: newOrder
      }));
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">Loading inspection data...</div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-center text-transparent">Inspection</h1>
          </header>
          
          <div className="space-y-4">
            <Collapsible open={isCQCExpanded} onOpenChange={setIsCQCExpanded}>
              <CollapsibleTrigger asChild>
                <div className="bg-primary/10 rounded-lg p-6 cursor-pointer hover:bg-primary/15 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1">CQC (Personal Care) </h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <MeetingStatusSummary sections={cqcSections} />
                      {isCQCExpanded ? <ChevronDown className="h-6 w-6 text-muted-foreground" /> : <ChevronRight className="h-6 w-6 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="space-y-0">
                  {cqcPanels.map(panel => <div key={panel.id} className="bg-white border-b last:border-b-0 overflow-hidden">
                      <div className="p-6 flex items-center justify-between transition-colors cursor-pointer" onClick={() => togglePanel(panel.id)}>
                        <div className="flex-1">
                          {isSuperAdmin ? <DebouncedInput value={panel.name} onSave={value => updatePanel(panel.id, value)} className="text-xl font-semibold mb-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground p-0 h-auto" placeholder="Panel name..." /> : <h2 className="text-xl font-semibold mb-1">{panel.name}</h2>}
                          <p className="text-muted-foreground text-sm">Updated: {getPanelLastUpdated(panel.id)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {expandedPanels.has(panel.id) ? <ChevronDown className="h-6 w-6 text-muted-foreground" /> : <ChevronRight className="h-6 w-6 text-muted-foreground" />}
                        </div>
                      </div>

                      {expandedPanels.has(panel.id) && <div className="bg-white text-black p-6">
                          {isSuperAdmin && <div className="mb-4">
                              <Button onClick={() => handleAddCategory(panel.id)} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add Category
                              </Button>
                            </div>}

                          {getOrderedCategoriesForPanel(panel.id).length > 0 && <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleDragEnd(event, panel.id)}>
                              <SortableContext items={getOrderedCategoriesForPanel(panel.id).map(cat => cat.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-6">
                                  {getOrderedCategoriesForPanel(panel.id).map(category => <SortableCategory key={category.id} category={category} isExpanded={expandedCategories.has(category.id)} onToggle={toggleCategory} onUpdateCategory={updateCategory} onAddEvidence={handleAddEvidence} onDeleteCategory={deleteCategory} getEvidenceForCategory={getEvidenceForCategory} getResponseForEvidence={getResponseForEvidence} getCategoryStatus={getCategoryStatus} getCategoryLastUpdated={getCategoryLastUpdated} updateEvidence={updateEvidence} updateResponse={updateResponse} deleteEvidence={deleteEvidence} handleStatusClick={handleStatusClick} isSuperAdmin={isSuperAdmin} />)}
                                </div>
                              </SortableContext>
                            </DndContext>}

                          {getCategoriesForPanel(panel.id).length === 0 && <div className="text-center py-8 text-muted-foreground">
                              {isSuperAdmin ? "No categories added yet. Click 'Add Category' to get started." : "No categories available for this panel."}
                            </div>}
                        </div>}
                    </div>)}
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* COS Checklist Section */}
            {cosCompliancePanel && <Collapsible open={isCOSExpanded} onOpenChange={setIsCOSExpanded}>
                <CollapsibleTrigger asChild>
                  <div className="bg-primary/10 rounded-lg p-6 cursor-pointer hover:bg-primary/15 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                         <h2 className="text-xl font-semibold mb-1">Home Office COS Checklist</h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <MeetingStatusSummary sections={cosSections} />
                        {isCOSExpanded ? <ChevronDown className="h-6 w-6 text-muted-foreground" /> : <ChevronRight className="h-6 w-6 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="bg-white text-black p-6 pb-16">
                    {isSuperAdmin && <div className="mb-4">
                        <Button onClick={() => handleAddCategory(cosCompliancePanel.id)} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Category
                        </Button>
                      </div>}

                    {getOrderedCategoriesForPanel(cosCompliancePanel.id).length > 0 && <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleDragEnd(event, cosCompliancePanel.id)}>
                        <SortableContext items={getOrderedCategoriesForPanel(cosCompliancePanel.id).map(cat => cat.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-6">
                            {getOrderedCategoriesForPanel(cosCompliancePanel.id).map(category => <SortableCategory key={category.id} category={category} isExpanded={expandedCategories.has(category.id)} onToggle={toggleCategory} onUpdateCategory={updateCategory} onAddEvidence={handleAddEvidence} onDeleteCategory={deleteCategory} getEvidenceForCategory={getEvidenceForCategory} getResponseForEvidence={getResponseForEvidence} getCategoryStatus={getCategoryStatus} getCategoryLastUpdated={getCategoryLastUpdated} updateEvidence={updateEvidence} updateResponse={updateResponse} deleteEvidence={deleteEvidence} handleStatusClick={handleStatusClick} isSuperAdmin={isSuperAdmin} />)}
                          </div>
                        </SortableContext>
                      </DndContext>}

                    {getCategoriesForPanel(cosCompliancePanel.id).length === 0 && <div className="text-center py-8 text-muted-foreground">
                        {isSuperAdmin ? "No categories added yet. Click 'Add Category' to get started." : "No categories available for this panel."}
                      </div>}
                  </div>
                </CollapsibleContent>
              </Collapsible>}
            
            {/* Ofsted Section */}
            {ofstedPanels.length > 0 && <Collapsible open={isOfstedExpanded} onOpenChange={setIsOfstedExpanded}>
                <CollapsibleTrigger asChild>
                  <div className="bg-primary/10 rounded-lg p-6 cursor-pointer hover:bg-primary/15 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-1">Ofsted (Supported Accomodation For Age 16-17)</h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <MeetingStatusSummary sections={ofstedSections} />
                        {isOfstedExpanded ? <ChevronDown className="h-6 w-6 text-muted-foreground" /> : <ChevronRight className="h-6 w-6 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="space-y-0">
                    {ofstedPanels.map(panel => <div key={panel.id} className="bg-white border-b last:border-b-0 overflow-hidden">
                        <div className="p-6 flex items-center justify-between transition-colors cursor-pointer" onClick={() => togglePanel(panel.id)}>
                          <div className="flex-1">
                            {isSuperAdmin ? <DebouncedInput value={panel.name} onSave={value => updatePanel(panel.id, value)} className="text-xl font-semibold mb-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground p-0 h-auto" placeholder="Panel name..." /> : <h2 className="text-xl font-semibold mb-1">{panel.name}</h2>}
                            <p className="text-muted-foreground text-sm">Updated: {getPanelLastUpdated(panel.id)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {expandedPanels.has(panel.id) ? <ChevronDown className="h-6 w-6 text-muted-foreground" /> : <ChevronRight className="h-6 w-6 text-muted-foreground" />}
                          </div>
                        </div>

                        {expandedPanels.has(panel.id) && <div className="bg-white text-black p-6 pb-16">
                            {isSuperAdmin && <div className="mb-4">
                                <Button onClick={() => handleAddCategory(panel.id)} className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Category
                                </Button>
                              </div>}

                            {getOrderedCategoriesForPanel(panel.id).length > 0 && <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleDragEnd(event, panel.id)}>
                                <SortableContext items={getOrderedCategoriesForPanel(panel.id).map(cat => cat.id)} strategy={verticalListSortingStrategy}>
                                  <div className="space-y-6">
                                    {getOrderedCategoriesForPanel(panel.id).map(category => <SortableCategory key={category.id} category={category} isExpanded={expandedCategories.has(category.id)} onToggle={toggleCategory} onUpdateCategory={updateCategory} onAddEvidence={handleAddEvidence} onDeleteCategory={deleteCategory} getEvidenceForCategory={getEvidenceForCategory} getResponseForEvidence={getResponseForEvidence} getCategoryStatus={getCategoryStatus} getCategoryLastUpdated={getCategoryLastUpdated} updateEvidence={updateEvidence} updateResponse={updateResponse} deleteEvidence={deleteEvidence} handleStatusClick={handleStatusClick} isSuperAdmin={isSuperAdmin} />)}
                                  </div>
                                </SortableContext>
                              </DndContext>}

                            {getCategoriesForPanel(panel.id).length === 0 && <div className="text-center py-8 text-muted-foreground">
                                {isSuperAdmin ? "No categories added yet. Click 'Add Category' to get started." : "No categories available for this panel."}
                              </div>}
                          </div>}
                      </div>)}
                  </div>
                </CollapsibleContent>
              </Collapsible>}
          </div>
        </div>
      </div>
    </div>;
};
export default Inspection;