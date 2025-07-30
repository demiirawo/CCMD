import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface QuarterlyReportGeneratorProps {
  quarter: string;
  year: string;
  meetings: Array<{
    id: string;
    title: string;
    date: string;
    attendees: any[];
    sections: any[];
    purpose?: string;
  }>;
}

export const QuarterlyReportGenerator: React.FC<QuarterlyReportGeneratorProps> = ({
  quarter,
  year,
  meetings
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateResponse } = useOpenAI();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Create comprehensive prompt for GPT-4o
      const systemPrompt = `You are an expert care agency analyst creating a comprehensive quarterly report. Generate a detailed, professional quarterly report that reads like a business document for stakeholders and regulatory bodies.

REQUIREMENTS:
- Use professional, flowing prose (no markdown formatting)
- Each section should be 3-4 substantial paragraphs (100-150 words each)
- Include specific metrics and analysis
- Write in narrative format suitable for board presentations

STRUCTURE:
1. Executive Summary
2. Operational Successes  
3. Learning Opportunities and Challenges
4. Workforce and Capacity Analysis
5. Care Quality and Service Delivery
6. Health, Safety and Risk Management
7. Continuous Improvement and Innovation
8. Strategic Outlook and Recommendations

Format as professional business prose with clear section headers.`;

      const userPrompt = `Generate a quarterly report for ${quarter} ${year}. 

Meeting data: ${meetings.length} meetings held this quarter covering operational areas.
${meetings.map(m => `- ${m.title} (${m.date}): ${m.attendees.length} attendees, ${m.sections.length} sections`).join('\n')}

Focus on industry-standard care agency performance metrics, operational excellence, and strategic insights.`;

      console.log('🚀 Generating report with GPT-4o...');
      
      const content = await generateResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 'gpt-4o');

      if (content) {
        // Navigate to the quarterly report view with generated content
        const encodedContent = encodeURIComponent(content);
        navigate(`/quarterly-report?quarter=${quarter}&year=${year}&content=${encodedContent}`);
        
        toast({
          title: "Report Generated",
          description: "Your quarterly report has been created successfully",
        });
      } else {
        throw new Error('No content generated');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the quarterly report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Generate Quarterly Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a comprehensive AI-powered quarterly report for {quarter} {year} based on your meeting data and operational metrics.
          </p>
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Report Scope:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {meetings.length} management meetings</li>
              <li>• Operational performance analysis</li>
              <li>• Compliance and quality metrics</li>
              <li>• Strategic recommendations</li>
            </ul>
          </div>

          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate AI Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};