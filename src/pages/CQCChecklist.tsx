
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAutoSave } from '@/hooks/useAutoSave';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSection } from '@/components/DashboardSection';
import { Navigation } from '@/components/Navigation';
import { StatusItemData } from '@/components/StatusItem';

interface CQCSection {
  title: string;
  items: StatusItemData[];
}

const CQCChecklist: React.FC = () => {
  const { user, profile } = useAuth();
  const [attendees, setAttendees] = useState<Array<{
    id: string;
    name: string;
    role: string;
    email: string;
  }>>([]);

  const [meetingData, setMeetingData] = useState({
    title: "CQC Assessment Meeting",
    date: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    purpose: "CQC regulatory assessment and compliance review"
  });

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

  const handleSectionUpdate = (sectionKey: string, items: StatusItemData[]) => {
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

  const handleDataChange = (field: string, value: string) => {
    setMeetingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-save functionality
  useAutoSave({
    data: { sections: cqcData, attendees, meetingData },
    delay: 2000
  });

  const getStats = () => {
    const allItems = Object.values(cqcData).flatMap(section => section.items);
    return {
      green: allItems.filter(item => item.status === 'green').length,
      amber: allItems.filter(item => item.status === 'amber').length,
      red: allItems.filter(item => item.status === 'red').length
    };
  };

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
          title={meetingData.title}
          date={meetingData.date}
          attendees={attendees}
          purpose={meetingData.purpose}
          stats={getStats()}
          onDataChange={handleDataChange}
          onAttendeesChange={handleAttendeesUpdate}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <DashboardSection
            title="Safe"
            items={cqcData.safe.items}
            onItemsChange={(items) => handleSectionUpdate('safe', items)}
          />

          <DashboardSection
            title="Effective"
            items={cqcData.effective.items}
            onItemsChange={(items) => handleSectionUpdate('effective', items)}
          />

          <DashboardSection
            title="Caring"
            items={cqcData.caring.items}
            onItemsChange={(items) => handleSectionUpdate('caring', items)}
          />

          <DashboardSection
            title="Responsive"
            items={cqcData.responsive.items}
            onItemsChange={(items) => handleSectionUpdate('responsive', items)}
          />

          <DashboardSection
            title="Well-Led"
            items={cqcData.wellLed.items}
            onItemsChange={(items) => handleSectionUpdate('wellLed', items)}
          />
        </div>
      </div>
    </div>
  );
};

export default CQCChecklist;
