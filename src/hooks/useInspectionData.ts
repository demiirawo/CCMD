import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface InspectionPanel {
  id: string;
  name: string;
  rating: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionCategory {
  id: string;
  panel_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionEvidence {
  id: string;
  category_id: string;
  evidence_text: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionCompanyResponse {
  id: string;
  company_id: string;
  evidence_id: string;
  comment: string;
  status: 'green' | 'amber' | 'red' | 'na';
  created_at: string;
  updated_at: string;
}

export const useInspectionData = () => {
  const { user, profile } = useAuth();
  const [panels, setPanels] = useState<InspectionPanel[]>([]);
  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  const [evidence, setEvidence] = useState<InspectionEvidence[]>([]);
  const [responses, setResponses] = useState<InspectionCompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.email === 'demi.irawo@care-cuddle.co.uk';

  useEffect(() => {
    if (user && profile?.company_id) {
      fetchData();
    }
  }, [user, profile?.company_id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch panels
      const { data: panelsData, error: panelsError } = await supabase
        .from('inspection_panels')
        .select('*')
        .order('name');

      if (panelsError) throw panelsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('inspection_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch evidence
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('inspection_evidence')
        .select('*')
        .order('created_at');

      if (evidenceError) throw evidenceError;

      // Fetch company responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('inspection_company_responses')
        .select('*')
        .eq('company_id', profile!.company_id);

      if (responsesError) throw responsesError;

      setPanels(panelsData || []);
      setCategories(categoriesData || []);
      setEvidence(evidenceData || []);
      setResponses((responsesData || []) as InspectionCompanyResponse[]);
    } catch (error) {
      console.error('Error fetching inspection data:', error);
      toast.error('Failed to load inspection data');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (panelId: string, name: string) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can add categories');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inspection_categories')
        .insert({ panel_id: panelId, name })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const updateCategory = async (categoryId: string, name: string) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can update categories');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inspection_categories')
        .update({ name })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(cat => cat.id === categoryId ? data : cat));
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const addEvidence = async (categoryId: string, evidenceText: string) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can add evidence');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inspection_evidence')
        .insert({ category_id: categoryId, evidence_text: evidenceText })
        .select()
        .single();

      if (error) throw error;

      setEvidence(prev => [...prev, data]);
      toast.success('Evidence added successfully');
    } catch (error) {
      console.error('Error adding evidence:', error);
      toast.error('Failed to add evidence');
    }
  };

  const updateEvidence = async (evidenceId: string, evidenceText: string) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can update evidence');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inspection_evidence')
        .update({ evidence_text: evidenceText })
        .eq('id', evidenceId)
        .select()
        .single();

      if (error) throw error;

      setEvidence(prev => prev.map(ev => ev.id === evidenceId ? data : ev));
      toast.success('Evidence updated successfully');
    } catch (error) {
      console.error('Error updating evidence:', error);
      toast.error('Failed to update evidence');
    }
  };

  const updateResponse = async (evidenceId: string, field: 'comment' | 'status', value: string) => {
    if (!profile?.company_id) return;

    try {
      const existingResponse = responses.find(r => r.evidence_id === evidenceId);

      if (existingResponse) {
        const { data, error } = await supabase
          .from('inspection_company_responses')
          .update({ [field]: value })
          .eq('id', existingResponse.id)
          .select()
          .single();

        if (error) throw error;

        setResponses(prev => prev.map(r => r.id === existingResponse.id ? data as InspectionCompanyResponse : r));
      } else {
        const { data, error } = await supabase
          .from('inspection_company_responses')
          .insert({
            company_id: profile.company_id,
            evidence_id: evidenceId,
            [field]: value,
            comment: field === 'comment' ? value : '',
            status: field === 'status' ? value as any : 'green'
          })
          .select()
          .single();

        if (error) throw error;

        setResponses(prev => [...prev, data as InspectionCompanyResponse]);
      }
    } catch (error) {
      console.error('Error updating response:', error);
      toast.error('Failed to update response');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can delete categories');
      return;
    }

    try {
      // First delete all evidence in this category
      const { error: evidenceError } = await supabase
        .from('inspection_evidence')
        .delete()
        .eq('category_id', categoryId);

      if (evidenceError) throw evidenceError;

      // Then delete the category
      const { error: categoryError } = await supabase
        .from('inspection_categories')
        .delete()
        .eq('id', categoryId);

      if (categoryError) throw categoryError;

      // Update local state
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setEvidence(prev => prev.filter(e => e.category_id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const deleteEvidence = async (evidenceId: string) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can delete evidence');
      return;
    }

    try {
      // First delete all responses for this evidence
      const { error: responsesError } = await supabase
        .from('inspection_company_responses')
        .delete()
        .eq('evidence_id', evidenceId);

      if (responsesError) throw responsesError;

      // Then delete the evidence
      const { error: evidenceError } = await supabase
        .from('inspection_evidence')
        .delete()
        .eq('id', evidenceId);

      if (evidenceError) throw evidenceError;

      // Update local state
      setEvidence(prev => prev.filter(e => e.id !== evidenceId));
      setResponses(prev => prev.filter(r => r.evidence_id !== evidenceId));
      toast.success('Evidence deleted successfully');
    } catch (error) {
      console.error('Error deleting evidence:', error);
      toast.error('Failed to delete evidence');
    }
  };

  const updatePanel = async (panelId: string, name: string) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can update panels');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inspection_panels')
        .update({ name })
        .eq('id', panelId)
        .select()
        .single();

      if (error) throw error;

      setPanels(prev => prev.map(panel => panel.id === panelId ? data : panel));
      toast.success('Panel updated successfully');
    } catch (error) {
      console.error('Error updating panel:', error);
      toast.error('Failed to update panel');
    }
  };

  return {
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
    updatePanel,
  };
};