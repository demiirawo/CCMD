import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSubsectionTags = (sectionId?: string, itemId?: string) => {
  const { companies, profile } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      if (!sectionId || !itemId || !profile?.company_id) {
        setTags([]);
        setLoading(false);
        return;
      }

      try {
        // Get the current company's compliance settings
        const currentCompany = companies.find(c => c.id === profile.company_id);
        if (!currentCompany) {
          setTags([]);
          setLoading(false);
          return;
        }

        // Determine which compliance option to use
        let complianceOption = '';
        if (currentCompany.cqc_personal_care) {
          complianceOption = 'CQC (Personal Care)';
        } else if (currentCompany.home_office_cos) {
          complianceOption = 'Home Office (Certificate of Sponsorship)';
        } else if (currentCompany.ofsted_supported_accommodation) {
          complianceOption = 'Ofsted (Supported Accomodation For Age 16-17)';
        }

        if (!complianceOption) {
          setTags([]);
          setLoading(false);
          return;
        }

        // Fetch tags for this compliance option and subsection
        const { data, error } = await supabase
          .from('service_subsection_tags')
          .select('tags')
          .eq('service', complianceOption)
          .eq('section_id', sectionId)
          .eq('item_id', itemId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching subsection tags:', error);
          setTags([]);
        } else if (data?.tags && Array.isArray(data.tags)) {
          setTags(data.tags as string[]);
        } else {
          setTags([]);
        }
      } catch (error) {
        console.error('Error in useSubsectionTags:', error);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [sectionId, itemId, profile?.company_id, companies]);

  return { tags, loading };
};
