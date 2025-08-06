
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CQCSection } from "@/components/CQCSection";
import { toast } from "@/hooks/use-toast";

interface CQCCategory {
  id: string;
  section_name: string;
  category_name: string;
  section_order: number;
  category_order: number;
}

interface CQCEvidence {
  id: string;
  category_id: string;
  title: string;
  explanation: string;
  rag_status: 'green' | 'amber' | 'red';
  comment: string;
  last_reviewed: string;
}

export const CQCChecklist = () => {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<CQCCategory[]>([]);
  const [evidence, setEvidence] = useState<CQCEvidence[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.permission === 'company_admin' || profile?.role === 'admin';

  useEffect(() => {
    fetchCQCData();
  }, [profile?.company_id]);

  const fetchCQCData = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('cqc_categories')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('section_order')
        .order('category_order');

      if (categoriesError) throw categoriesError;

      // Fetch evidence
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('cqc_evidence')
        .select('*')
        .eq('company_id', profile.company_id);

      if (evidenceError) throw evidenceError;

      setCategories(categoriesData || []);
      setEvidence((evidenceData || []) as CQCEvidence[]);
    } catch (error) {
      console.error('Error fetching CQC data:', error);
      toast({
        title: "Error",
        description: "Failed to load CQC checklist data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEvidenceChange = async (evidenceId: string, field: string, value: any) => {
    try {
      const updateData: any = { [field]: value };
      
      // Update last_reviewed when status or comment changes
      if (field === 'rag_status' || field === 'comment') {
        updateData.last_reviewed = new Date().toISOString();
      }

      const { error } = await supabase
        .from('cqc_evidence')
        .update(updateData)
        .eq('id', evidenceId);

      if (error) throw error;

      // Update local state
      setEvidence(prev => prev.map(item => 
        item.id === evidenceId 
          ? { ...item, ...updateData }
          : item
      ));

      toast({
        title: "Success",
        description: "Evidence updated successfully",
      });
    } catch (error) {
      console.error('Error updating evidence:', error);
      toast({
        title: "Error",
        description: "Failed to update evidence",
        variant: "destructive",
      });
    }
  };

  const handleAddEvidence = async (categoryId: string) => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('cqc_evidence')
        .insert([{
          category_id: categoryId,
          title: 'New Evidence',
          explanation: 'Click to edit explanation',
          rag_status: 'green',
          comment: '',
          company_id: profile?.company_id
        }])
        .select()
        .single();

      if (error) throw error;

      setEvidence(prev => [...prev, data as CQCEvidence]);
      toast({
        title: "Success",
        description: "New evidence added",
      });
    } catch (error) {
      console.error('Error adding evidence:', error);
      toast({
        title: "Error",
        description: "Failed to add evidence",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('cqc_evidence')
        .delete()
        .eq('id', evidenceId);

      if (error) throw error;

      setEvidence(prev => prev.filter(item => item.id !== evidenceId));
      toast({
        title: "Success",
        description: "Evidence deleted",
      });
    } catch (error) {
      console.error('Error deleting evidence:', error);
      toast({
        title: "Error",
        description: "Failed to delete evidence",
        variant: "destructive",
      });
    }
  };

  // Group categories by section
  const sectionGroups = categories.reduce((acc, category) => {
    if (!acc[category.section_name]) {
      acc[category.section_name] = [];
    }
    acc[category.section_name].push(category);
    return acc;
  }, {} as Record<string, CQCCategory[]>);

  const sectionOrder = ['SAFE', 'EFFECTIVE', 'CARING', 'RESPONSIVE', 'WELL-LED'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">CQC Checklist</h1>
          <p className="text-muted-foreground">
            Manage your Care Quality Commission compliance evidence across the five key domains
          </p>
        </div>

        <div className="space-y-6">
          {sectionOrder.map(sectionName => {
            const sectionCategories = sectionGroups[sectionName] || [];
            
            // Convert categories to CQC format
            const cqcCategories = sectionCategories.map(category => {
              const categoryEvidence = evidence.filter(e => e.category_id === category.id);
              
              // Calculate status based on evidence RAG statuses
              const hasRed = categoryEvidence.some(e => e.rag_status === 'red');
              const hasAmber = categoryEvidence.some(e => e.rag_status === 'amber');
              let status: 'green' | 'amber' | 'red' = 'green';
              
              if (hasRed) status = 'red';
              else if (hasAmber) status = 'amber';

              return {
                id: category.id,
                category_name: category.category_name,
                evidence: categoryEvidence,
                status
              };
            });

            return (
              <CQCSection
                key={sectionName}
                title={sectionName}
                categories={cqcCategories}
                isAdmin={isAdmin}
                onEvidenceChange={handleEvidenceChange}
                onAddEvidence={handleAddEvidence}
                onDeleteEvidence={handleDeleteEvidence}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
