import { supabase } from "@/integrations/supabase/client";

export interface EvidenceItem {
  id: string;
  referenceId: string;
  evidenceText: string;
  categoryName: string;
  complianceType: 'CQC' | 'HO' | 'OFT';
  status: string;
  comment: string;
  categoryId: string;
}

export interface EvidenceResponse {
  evidence_id: string;
  status: string;
  comment: string;
  company_id: string;
}

/**
 * Fetches all evidence items from the inspection tables with their reference IDs
 */
export const getAllEvidenceItems = async (companyId: string): Promise<EvidenceItem[]> => {
  try {
    // Fetch panels, categories, evidence, and responses
    const [panelsResult, categoriesResult, evidenceResult, responsesResult] = await Promise.all([
      supabase.from('inspection_panels').select('*').order('name'),
      supabase.from('inspection_categories').select('*'),
      supabase.from('inspection_evidence').select('*'),
      supabase.from('inspection_company_responses').select('*').eq('company_id', companyId)
    ]);

    if (panelsResult.error) throw panelsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (evidenceResult.error) throw evidenceResult.error;
    if (responsesResult.error) throw responsesResult.error;

    const panels = panelsResult.data || [];
    const categories = categoriesResult.data || [];
    const evidence = evidenceResult.data || [];
    const responses = responsesResult.data || [];

    // Build evidence items with reference IDs
    const evidenceItems: EvidenceItem[] = [];

    // Separate panels into types
    const cqcPanels = panels.filter(p => p.name !== 'COS Checklist' && !p.name.includes('Ofsted'));
    const cosPanel = panels.find(p => p.name === 'COS Checklist');
    const ofstedPanels = panels.filter(p => p.name.includes('Ofsted'));

    // Build reference maps
    const buildItems = (panelList: any[], prefix: 'CQC' | 'HO' | 'OFT') => {
      let counter = 1;
      panelList.forEach(panel => {
        const panelCategories = categories.filter(c => c.panel_id === panel.id);
        panelCategories.forEach(category => {
          const categoryEvidence = evidence.filter(e => e.category_id === category.id);
          categoryEvidence.forEach(ev => {
            const response = responses.find(r => r.evidence_id === ev.id);
            evidenceItems.push({
              id: ev.id,
              referenceId: `${prefix}${counter}`,
              evidenceText: ev.evidence_text,
              categoryName: category.name,
              complianceType: prefix,
              status: response?.status || 'green',
              comment: response?.comment || '',
              categoryId: category.id
            });
            counter++;
          });
        });
      });
    };

    buildItems(cqcPanels, 'CQC');
    if (cosPanel) buildItems([cosPanel], 'HO');
    buildItems(ofstedPanels, 'OFT');

    return evidenceItems;
  } catch (error) {
    console.error('Error fetching evidence items:', error);
    return [];
  }
};

/**
 * Gets the full details of evidence items by their reference IDs
 */
export const getLinkedEvidenceDetails = async (
  referenceIds: string[],
  companyId: string
): Promise<EvidenceItem[]> => {
  const allEvidence = await getAllEvidenceItems(companyId);
  return allEvidence.filter(ev => referenceIds.includes(ev.referenceId));
};

/**
 * Updates an evidence response (comment or status)
 */
export const updateEvidenceResponse = async (
  evidenceId: string,
  companyId: string,
  field: 'comment' | 'status',
  value: string
): Promise<boolean> => {
  try {
    // Check if response exists
    const { data: existing } = await supabase
      .from('inspection_company_responses')
      .select('*')
      .eq('evidence_id', evidenceId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (existing) {
      // Update existing response
      const { error } = await supabase
        .from('inspection_company_responses')
        .update({ [field]: value })
        .eq('evidence_id', evidenceId)
        .eq('company_id', companyId);

      if (error) throw error;
    } else {
      // Create new response
      const { error } = await supabase
        .from('inspection_company_responses')
        .insert({
          evidence_id: evidenceId,
          company_id: companyId,
          [field]: value
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating evidence response:', error);
    return false;
  }
};
