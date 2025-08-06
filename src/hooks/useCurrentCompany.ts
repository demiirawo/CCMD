
import { useAuth } from "./useAuth";

export const useCurrentCompany = () => {
  const { profile, companies } = useAuth();
  
  const currentCompany = companies.find(c => c.id === profile?.active_company_id);
  
  return {
    currentCompany,
    companyId: profile?.active_company_id || null
  };
};
