import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Navigation } from "@/components/Navigation";

// Simple placeholder component - functionality moved to QuarterlyReportGenerator
export const ReportBuilder: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navigation />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Report Builder</h1>
          <p className="text-muted-foreground mb-6">
            Report generation has been simplified. Use the Generate AI Report button on the Reports page.
          </p>
          <Button onClick={() => navigate('/reports')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </div>
      </div>
    </>
  );
};

export default ReportBuilder;