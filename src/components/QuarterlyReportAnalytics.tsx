import React from 'react';
import { FeedbackAnalytics } from './FeedbackAnalytics';
import { IncidentsAnalytics } from './IncidentsAnalytics';

interface QuarterlyReportAnalyticsProps {
  type: 'feedback' | 'incidents';
  quarter: string;
  year: string;
}

export const QuarterlyReportAnalytics: React.FC<QuarterlyReportAnalyticsProps> = ({
  type,
  quarter,
  year
}) => {
  // Calculate a representative date for the quarter for the analytics components
  const getQuarterDate = (quarter: string, year: string) => {
    const quarterMap: { [key: string]: string } = {
      'Q1': `${year}-03-31`,
      'Q2': `${year}-06-30`, 
      'Q3': `${year}-09-30`,
      'Q4': `${year}-12-31`
    };
    return quarterMap[quarter] || `${year}-12-31`;
  };

  const quarterDate = getQuarterDate(quarter, year);

  if (type === 'feedback') {
    return (
      <div className="w-full">
        <FeedbackAnalytics meetingDate={new Date(quarterDate)} />
      </div>
    );
  }

  if (type === 'incidents') {
    return (
      <div className="w-full">
        <IncidentsAnalytics meetingDate={new Date(quarterDate)} />
      </div>
    );
  }

  return null;
};