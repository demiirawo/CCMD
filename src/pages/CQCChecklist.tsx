
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSection } from '@/components/DashboardSection';
import { StatusItemData } from '@/components/StatusItem';
import { Attendee } from '@/components/MeetingAttendeesManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// CQC-specific sections
const CQC_SECTIONS = [
  {
    id: "safe",
    title: "Safe",
    items: []
  },
  {
    id: "effective",
    title: "Effective",
    items: []
  },
  {
    id: "caring",
    title: "Caring",
    items: []
  },
  {
    id: "responsive",
    title: "Responsive",
    items: []
  },
  {
    id: "well-led",
    title: "Well-Led",
    items: []
  }
];

const CQCChecklist: React.FC = () => {
  const { profile, companies } = useAuth();
  const [sections, setSections] = useState(CQC_SECTIONS);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [cqcData, setCqcData] = useState({
    title: "CQC Quality Review",
    date: new Date().toISOString(),
    purpose: "CQC quality assessment and compliance review"
  });
  const [panelStateTracker, setPanelStateTracker] = useState(0);

  const currentCompany = companies.find(c => c.id === profile?.company_id);

  useEffect(() => {
    loadCQCData();
  }, [profile?.company_id]);

  const loadCQCData = async () => {
    if (!profile?.company_id) return;

    try {
      // Load or create CQC checklist data
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('meeting_type', 'cqc_checklist')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading CQC data:', error);
        return;
      }

      if (data) {
        // Parse existing data
        const parsedSections = typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections;
        const parsedAttendees = typeof data.attendees === 'string' ? JSON.parse(data.attendees) : data.attendees;
        
        setSections(parsedSections || CQC_SECTIONS);
        setAttendees(parsedAttendees || []);
        setCqcData({
          title: data.title || "CQC Quality Review",
          date: data.date || new Date().toISOString(),
          purpose: data.purpose || "CQC quality assessment and compliance review"
        });
      }
    } catch (error) {
      console.error('Error loading CQC data:', error);
      toast({
        title: "Error",
        description: "Failed to load CQC checklist data",
        variant: "destructive"
      });
    }
  };

  const saveCQCData = async () => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('meetings')
        .upsert({
          company_id: profile.company_id,
          meeting_type: 'cqc_checklist',
          title: cqcData.title,
          date: cqcData.date,
          purpose: cqcData.purpose,
          attendees: JSON.stringify(attendees),
          sections: JSON.stringify(sections),
          actions_log: JSON.stringify([])
        }, {
          onConflict: 'company_id,meeting_type'
        });

      if (error) {
        console.error('Error saving CQC data:', error);
        toast({
          title: "Error",
          description: "Failed to save CQC checklist data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving CQC data:', error);
    }
  };

  const handleDataChange = (field: string, value: string) => {
    setCqcData(prev => ({
      ...prev,
      [field]: value
    }));
    saveCQCData();
  };

  const handleItemStatusChange = (sectionId: string, itemId: string, status: any) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map((item: StatusItemData) => 
            item.id === itemId ? { ...item, status } : item
          )
        };
      }
      return section;
    }));
    saveCQCData();
  };

  const handleItemObservationChange = (sectionId: string, itemId: string, observation: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map((item: StatusItemData) => 
            item.id === itemId ? { ...item, observation } : item
          )
        };
      }
      return section;
    }));
    saveCQCData();
  };

  const handleAddItem = (sectionTitle: string) => {
    const sectionId = sections.find(s => s.title === sectionTitle)?.id;
    if (!sectionId) return;

    const newItem: StatusItemData = {
      id: `item_${Date.now()}`,
      title: "New CQC Item",
      status: "green",
      observation: "",
      trendsThemes: "",
      lessonsLearned: "",
      actions: [],
      documents: [],
      lastReviewed: new Date().toLocaleDateString('en-GB')
    };

    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...section.items, newItem]
        };
      }
      return section;
    }));
    saveCQCData();
  };

  const calculateStats = () => {
    const allItems = sections.flatMap(section => section.items || []);
    return {
      green: allItems.filter(item => item.status === "green").length,
      amber: allItems.filter(item => item.status === "amber").length,
      red: allItems.filter(item => item.status === "red").length
    };
  };

  return (
    <div className="bg-gray-100 p-4 lg:p-8">
      <div className="w-[90%] mx-auto space-y-6">
        {/* Company Header */}
        {currentCompany && (
          <div className="text-center py-6">
            {currentCompany.logo_url && (
              <img 
                src={currentCompany.logo_url} 
                alt={`${currentCompany.name} logo`}
                className="h-16 w-auto mx-auto mb-4"
              />
            )}
            <h1 className="text-2xl font-bold text-foreground">{currentCompany.name}</h1>
          </div>
        )}

        <DashboardHeader
          date={cqcData.date}
          title={cqcData.title}
          attendees={attendees}
          purpose={cqcData.purpose}
          stats={calculateStats()}
          sections={sections}
          actionsLog={[]}
          onDataChange={handleDataChange}
          onAttendeesChange={setAttendees}
        />

        {/* CQC Sections */}
        {sections.map((section) => (
          <DashboardSection
            key={section.id}
            title={section.title}
            items={section.items || []}
            onItemStatusChange={(itemId, status) => handleItemStatusChange(section.id, itemId, status)}
            onItemObservationChange={(itemId, observation) => handleItemObservationChange(section.id, itemId, observation)}
            onAddItem={handleAddItem}
            attendees={attendees.map(a => a.name)}
            defaultOpen={true}
            panelStateTracker={panelStateTracker}
            onPanelStateChange={() => setPanelStateTracker(prev => prev + 1)}
            meetingDate={new Date(cqcData.date)}
          />
        ))}
      </div>
    </div>
  );
};

export default CQCChecklist;
