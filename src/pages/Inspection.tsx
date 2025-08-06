import { Navigation } from "@/components/Navigation";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge, StatusType } from "@/components/StatusBadge";

interface Evidence {
  id: string;
  evidence: string;
  comment: string;
  status: StatusType;
  lastUpdated: string;
}

interface Category {
  id: string;
  name: string;
  evidenceItems: Evidence[];
}

interface Panel {
  name: string;
  rating: string;
  updated: string;
  categories: Category[];
}

const Inspection = () => {
  const [panels, setPanels] = useState<Panel[]>([
    {
      name: "SAFE",
      rating: "G",
      updated: "06/08/2025",
      categories: []
    },
    {
      name: "EFFECTIVE", 
      rating: "G",
      updated: "06/08/2025",
      categories: []
    },
    {
      name: "RESPONSIVE",
      rating: "G", 
      updated: "06/08/2025",
      categories: []
    },
    {
      name: "WELL LED",
      rating: "G",
      updated: "06/08/2025", 
      categories: []
    },
    {
      name: "CARING",
      rating: "G",
      updated: "06/08/2025",
      categories: []
    }
  ]);

  const [expandedPanels, setExpandedPanels] = useState<Set<number>>(new Set());

  const togglePanel = (index: number) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPanels(newExpanded);
  };

  const addCategory = (panelIndex: number) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: "New Category",
      evidenceItems: []
    };

    setPanels(prev => prev.map((panel, index) => 
      index === panelIndex 
        ? { ...panel, categories: [...panel.categories, newCategory] }
        : panel
    ));
  };

  const addEvidence = (panelIndex: number, categoryId: string) => {
    const newEvidence: Evidence = {
      id: Date.now().toString(),
      evidence: "",
      comment: "",
      status: "green",
      lastUpdated: new Date().toLocaleDateString()
    };

    setPanels(prev => prev.map((panel, index) => 
      index === panelIndex 
        ? {
            ...panel,
            categories: panel.categories.map(cat => 
              cat.id === categoryId 
                ? { ...cat, evidenceItems: [...cat.evidenceItems, newEvidence] }
                : cat
            )
          }
        : panel
    ));
  };

  const updateCategory = (panelIndex: number, categoryId: string, field: keyof Category, value: string) => {
    setPanels(prev => prev.map((panel, index) => 
      index === panelIndex 
        ? {
            ...panel,
            categories: panel.categories.map(cat => 
              cat.id === categoryId 
                ? { ...cat, [field]: value }
                : cat
            )
          }
        : panel
    ));
  };

  const updateEvidence = (panelIndex: number, categoryId: string, evidenceId: string, field: keyof Evidence, value: string | StatusType) => {
    setPanels(prev => prev.map((panel, index) => 
      index === panelIndex 
        ? {
            ...panel,
            categories: panel.categories.map(cat => 
              cat.id === categoryId 
                ? {
                    ...cat,
                    evidenceItems: cat.evidenceItems.map(evidence => 
                      evidence.id === evidenceId 
                        ? { ...evidence, [field]: value, lastUpdated: field !== 'lastUpdated' ? new Date().toLocaleDateString() : evidence.lastUpdated }
                        : evidence
                    )
                  }
                : cat
            )
          }
        : panel
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            {panels.map((panel, panelIndex) => (
              <div key={panelIndex} className="bg-green-600 text-white rounded-lg overflow-hidden">
                <div 
                  className="p-6 flex items-center justify-between hover:bg-green-700 transition-colors cursor-pointer"
                  onClick={() => togglePanel(panelIndex)}
                >
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-1">{panel.name}</h2>
                    <p className="text-green-100 text-sm">Updated: {panel.updated}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {expandedPanels.has(panelIndex) ? (
                      <ChevronDown className="h-6 w-6 text-white/80" />
                    ) : (
                      <ChevronRight className="h-6 w-6 text-white/80" />
                    )}
                  </div>
                </div>

                {expandedPanels.has(panelIndex) && (
                  <div className="bg-white text-black p-6">
                    <div className="mb-4">
                      <Button 
                        onClick={() => addCategory(panelIndex)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Category
                      </Button>
                    </div>

                    {panel.categories.length > 0 && (
                      <div className="space-y-6">
                        {panel.categories.map((category) => (
                          <Card key={category.id} className="p-4">
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <Input
                                  value={category.name}
                                  onChange={(e) => updateCategory(panelIndex, category.id, 'name', e.target.value)}
                                  className="font-medium text-lg max-w-md"
                                  placeholder="Category name..."
                                />
                                <Button 
                                  onClick={() => addEvidence(panelIndex, category.id)}
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add Evidence
                                </Button>
                              </div>
                            </div>

                            {category.evidenceItems.length > 0 && (
                              <div className="space-y-2">
                                {/* Grid Header */}
                                <div className="grid grid-cols-4 gap-4 font-semibold border-b pb-2 text-sm">
                                  <div>Evidence</div>
                                  <div>Comment</div>
                                  <div>Status</div>
                                  <div>Last Updated</div>
                                </div>

                                {/* Evidence Rows */}
                                {category.evidenceItems.map((evidence) => (
                                  <div key={evidence.id} className="grid grid-cols-4 gap-4 items-start py-2 border-b border-gray-100">
                                    <div>
                                      <Textarea
                                        value={evidence.evidence}
                                        onChange={(e) => updateEvidence(panelIndex, category.id, evidence.id, 'evidence', e.target.value)}
                                        placeholder="Enter evidence..."
                                        className="text-sm min-h-[100px] resize-y"
                                      />
                                    </div>
                                    <div>
                                      <Textarea
                                        value={evidence.comment}
                                        onChange={(e) => updateEvidence(panelIndex, category.id, evidence.id, 'comment', e.target.value)}
                                        placeholder="Enter comment..."
                                        className="text-sm min-h-[100px] resize-y"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <StatusBadge status={evidence.status} />
                                      <select
                                        value={evidence.status}
                                        onChange={(e) => updateEvidence(panelIndex, category.id, evidence.id, 'status', e.target.value as StatusType)}
                                        className={`p-2 border rounded text-sm font-medium ${
                                          evidence.status === 'green' ? 'bg-green-100 text-green-800 border-green-300' :
                                          evidence.status === 'amber' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                          evidence.status === 'red' ? 'bg-red-100 text-red-800 border-red-300' :
                                          'bg-gray-100 text-gray-800 border-gray-300'
                                        }`}
                                      >
                                        <option value="green">Green</option>
                                        <option value="amber">Amber</option>
                                        <option value="red">Red</option>
                                        <option value="na">N/A</option>
                                      </select>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {evidence.lastUpdated}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {category.evidenceItems.length === 0 && (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                No evidence added yet. Click "Add Evidence" to get started.
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}

                    {panel.categories.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No categories added yet. Click "Add Category" to get started.
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