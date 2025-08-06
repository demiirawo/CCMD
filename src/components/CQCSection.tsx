
import { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

interface CQCEvidence {
  id: string;
  category_id: string;
  title: string;
  explanation: string;
  rag_status: 'green' | 'amber' | 'red';
  comment: string;
  last_reviewed: string;
  tags: string[];
}

interface CQCCategory {
  id: string;
  category_name: string;
  evidence: CQCEvidence[];
  status: 'green' | 'amber' | 'red';
}

interface CQCSectionProps {
  title: string;
  categories: CQCCategory[];
  isAdmin: boolean;
  onEvidenceChange: (evidenceId: string, field: string, value: any) => void;
  onAddEvidence: (categoryId: string) => void;
  onDeleteEvidence: (evidenceId: string) => void;
}

// Common dashboard subsection tags
const AVAILABLE_TAGS = [
  'Staff Documents',
  'Staff Training',
  'Supervision',
  'Incidents',
  'Feedback',
  'Care Plans',
  'Medication',
  'Spot Checks',
  'Care Notes',
  'Service User Documents',
  'Key Documents',
  'Resourcing'
];

export const CQCSection = ({
  title,
  categories,
  isAdmin,
  onEvidenceChange,
  onAddEvidence,
  onDeleteEvidence
}: CQCSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  // Calculate overall section status
  const hasRed = categories.some(cat => cat.status === 'red');
  const hasAmber = categories.some(cat => cat.status === 'amber');
  let overallStatus: 'green' | 'amber' | 'red' = 'green';
  
  if (hasRed) overallStatus = 'red';
  else if (hasAmber) overallStatus = 'amber';

  const getSectionBackgroundClass = () => {
    switch (overallStatus) {
      case 'red':
        return 'bg-red-50 border-red-200';
      case 'amber':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const handleTagChange = (evidenceId: string, tag: string, isChecked: boolean) => {
    const evidence = categories.flatMap(cat => cat.evidence).find(e => e.id === evidenceId);
    if (!evidence) return;

    const currentTags = evidence.tags || [];
    const newTags = isChecked 
      ? [...currentTags, tag]
      : currentTags.filter(t => t !== tag);
    
    onEvidenceChange(evidenceId, 'tags', newTags);
  };

  return (
    <div className={cn("rounded-lg border p-6 mb-6", getSectionBackgroundClass())}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <StatusBadge status={overallStatus} />
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>

      {isOpen && (
        <div className="mt-6 space-y-4">
          {categories.map(category => (
            <div key={category.id} className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{category.category_name}</h3>
                  <StatusBadge status={category.status} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {category.evidence.length} evidence item{category.evidence.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {category.evidence.map(evidenceItem => (
                  <div key={evidenceItem.id} className="border rounded-lg p-4 bg-background">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {isAdmin ? (
                          <input
                            type="text"
                            value={evidenceItem.title}
                            onChange={(e) => onEvidenceChange(evidenceItem.id, 'title', e.target.value)}
                            className="font-medium text-lg bg-transparent border-none p-0 w-full focus:outline-none focus:ring-2 focus:ring-primary rounded"
                          />
                        ) : (
                          <h4 className="font-medium text-lg">{evidenceItem.title}</h4>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => onDeleteEvidence(evidenceItem.id)}
                          className="text-destructive hover:text-destructive/80 ml-2 text-xl"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {isAdmin ? (
                      <textarea
                        value={evidenceItem.explanation}
                        onChange={(e) => onEvidenceChange(evidenceItem.id, 'explanation', e.target.value)}
                        className="w-full p-2 border rounded mb-3 min-h-[80px] resize-vertical"
                        placeholder="Evidence explanation..."
                      />
                    ) : (
                      <p className="text-muted-foreground mb-3">{evidenceItem.explanation}</p>
                    )}

                    {/* Tags Section */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Dashboard Subsections (Tags)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {AVAILABLE_TAGS.map(tag => (
                          <label key={tag} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={(evidenceItem.tags || []).includes(tag)}
                              onChange={(e) => handleTagChange(evidenceItem.id, tag, e.target.checked)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="truncate" title={tag}>{tag}</span>
                          </label>
                        ))}
                      </div>
                      {evidenceItem.tags && evidenceItem.tags.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {evidenceItem.tags.map(tag => (
                              <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <select
                          value={evidenceItem.rag_status}
                          onChange={(e) => onEvidenceChange(evidenceItem.id, 'rag_status', e.target.value)}
                          className="border rounded px-2 py-1 bg-background"
                        >
                          <option value="green">Green</option>
                          <option value="amber">Amber</option>
                          <option value="red">Red</option>
                        </select>
                        
                        <input
                          type="text"
                          value={evidenceItem.comment}
                          onChange={(e) => onEvidenceChange(evidenceItem.id, 'comment', e.target.value)}
                          placeholder="Add comment..."
                          className="border rounded px-2 py-1 flex-1 bg-background"
                        />
                      </div>
                      
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Last reviewed: {new Date(evidenceItem.last_reviewed).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isAdmin && (
                  <button
                    onClick={() => onAddEvidence(category.id)}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 p-2 border-2 border-dashed border-primary/30 rounded-lg w-full justify-center hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Evidence
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
