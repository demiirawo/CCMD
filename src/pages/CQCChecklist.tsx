
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAutoSave } from '@/hooks/useAutoSave';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSection } from '@/components/DashboardSection';
import { Navigation } from '@/components/Navigation';

interface CQCSection {
  title: string;
  items: Array<{
    title: string;
    content: string;
    status: 'green' | 'amber' | 'red' | 'blue';
    rag: 'green' | 'amber' | 'red';
    last_updated: string;
    assigned_to: string;
  }>;
}

const CQCChecklist: React.FC = () => {
  const { user, profile } = useAuth();
  const [attendees, setAttendees] = useState<Array<{
    id: string;
    name: string;
    role: string;
    email: string;
  }>>([]);

  const [cqcData, setCqcData] = useState<Record<string, CQCSection>>({
    safe: {
      title: "Safe",
      items: []
    },
    effective: {
      title: "Effective", 
      items: []
    },
    caring: {
      title: "Caring",
      items: []
    },
    responsive: {
      title: "Responsive",
      items: []
    },
    wellLed: {
      title: "Well-Led",
      items: []
    }
  });

  const handleSectionUpdate = (sectionKey: string, items: any[]) => {
    setCqcData(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        items
      }
    }));
  };

  const handleAttendeesUpdate = (newAttendees: typeof attendees) => {
    setAttendees(newAttendees);
  };

  // Auto-save functionality
  useAutoSave({
    data: { sections: cqcData, attendees },
    onSave: async (data) => {
      console.log('Auto-saving CQC checklist data:', data);
      // Auto-save logic would go here
    },
    delay: 2000
  });

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <DashboardHeader
          title="CQC Checklist"
          meetingType="CQC Assessment"
          attendees={attendees}
          onAttendeesUpdate={handleAttendeesUpdate}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <DashboardSection
            title="Safe"
            sectionKey="safe"
            items={cqcData.safe.items}
            onItemsChange={(items) => handleSectionUpdate('safe', items)}
          />

          <DashboardSection
            title="Effective"
            sectionKey="effective"
            items={cqcData.effective.items}
            onItemsChange={(items) => handleSectionUpdate('effective', items)}
          />

          <DashboardSection
            title="Caring"
            sectionKey="caring"
            items={cqcData.caring.items}
            onItemsChange={(items) => handleSectionUpdate('caring', items)}
          />

          <DashboardSection
            title="Responsive"
            sectionKey="responsive"
            items={cqcData.responsive.items}
            onItemsChange={(items) => handleSectionUpdate('responsive', items)}
          />

          <DashboardSection
            title="Well-Led"
            sectionKey="wellLed"
            items={cqcData.wellLed.items}
            onItemsChange={(items) => handleSectionUpdate('wellLed', items)}
          />
        </div>
      </div>
    </div>
  );
};

export default CQCChecklist;
