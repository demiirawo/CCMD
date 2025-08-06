
import { useAuth } from '@/hooks/useAuth';

export const useCurrentCompany = () => {
  const { profile, userCompanies } = useAuth();
  
  // Get the current company ID from the profile
  const currentCompanyId = profile?.active_company_id;
  
  // Find the current company details from userCompanies
  const currentCompany = userCompanies.find(uc => uc.company_id === currentCompanyId);
  
  // Get user's permission for the current company
  const currentPermission = currentCompany?.permission || 'read';
  
  return {
    currentCompanyId,
    currentCompany,
    currentPermission,
    isCompanyAdmin: currentPermission === 'company_admin',
    canEdit: currentPermission === 'edit' || currentPermission === 'company_admin'
  };
};
