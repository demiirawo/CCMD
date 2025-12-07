import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ServiceUser, Staff } from "@/hooks/useMatchingData";
interface ForecastAISummaryProps {
  serviceUsers: ServiceUser[];
  staff: Staff[];
  weeks: string[];
  showUtilisation: boolean;
  showMatchmaking: boolean;
}
export const ForecastAISummary = ({
  serviceUsers,
  staff,
  weeks,
  showUtilisation,
  showMatchmaking
}: ForecastAISummaryProps) => {
  const {
    generateResponse,
    isLoading
  } = useOpenAI();
  const {
    toast
  } = useToast();
  const {
    companies,
    profile
  } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const currentCompany = companies.find(c => c.id === profile?.company_id);
  const companyName = currentCompany?.name || "the organization";
  const collectForecastData = () => {
    let data = "";

    // Calculate utilisation metrics for each week
    if (showUtilisation) {
      data += "=== Staff Utilisation Forecast (8 Weeks) ===\n\n";
      weeks.forEach(week => {
        const requiredHours = serviceUsers.reduce((sum, u) => sum + (u.forecastHours[week] || 0), 0);
        const allocatedHours = serviceUsers.reduce((sum, u) => {
          return sum + u.staffAllocations.reduce((allocSum, alloc) => {
            return allocSum + (alloc.allocatedHours[week] || 0);
          }, 0);
        }, 0);

        // Unallocated staff hours
        const allocatedStaffIds = new Set(serviceUsers.flatMap(u => u.staffAllocations.map(a => a.staffId)));
        const unallocatedHours = staff.filter(s => !allocatedStaffIds.has(s.id)).reduce((sum, s) => sum + (s.forecastHours[week] || 0), 0);
        const totalAvailable = allocatedHours + unallocatedHours;
        const utilisation = totalAvailable > 0 ? allocatedHours / totalAvailable * 100 : 0;
        data += `Week ${week}: Required ${requiredHours}h, Allocated ${allocatedHours}h, Unallocated ${unallocatedHours}h, Utilisation ${utilisation.toFixed(1)}%\n`;
      });

      // Overall stats
      data += `\nTotal Service Users: ${serviceUsers.length}\n`;
      data += `Total Staff: ${staff.length}\n`;

      // Staff without assignments
      const allocatedStaffIds = new Set(serviceUsers.flatMap(u => u.staffAllocations.map(a => a.staffId)));
      const unallocatedStaff = staff.filter(s => !allocatedStaffIds.has(s.id));
      if (unallocatedStaff.length > 0) {
        data += `\nUnallocated Staff: ${unallocatedStaff.length} (${unallocatedStaff.map(s => s.name).join(', ')})\n`;
      }
    }

    // Collect matchmaking data
    if (showMatchmaking) {
      data += "\n=== Staff Matching Analysis ===\n\n";

      // Group by location
      const locations = [...new Set(serviceUsers.map(u => u.location))];
      locations.forEach(location => {
        const usersInLocation = serviceUsers.filter(u => u.location === location);
        const staffInLocation = staff.filter(s => s.location === location);
        data += `Location: ${location}\n`;
        data += `  Service Users: ${usersInLocation.length}\n`;
        data += `  Staff Available: ${staffInLocation.length}\n`;
        usersInLocation.forEach(user => {
          const primaryStaff = user.primaryStaffIds.map(id => staff.find(s => s.id === id)?.name).filter(Boolean);
          const backupStaff = user.backupStaffIds.map(id => staff.find(s => s.id === id)?.name).filter(Boolean);
          data += `  ${user.name}:\n`;
          data += `    - Primary Staff: ${primaryStaff.length > 0 ? primaryStaff.join(', ') : 'None assigned'}\n`;
          data += `    - Backup Staff: ${backupStaff.length > 0 ? backupStaff.join(', ') : 'None assigned'}\n`;
          data += `    - Support Needs: ${user.supportNeeds.join(', ') || 'None specified'}\n`;
          data += `    - Gender Preference: ${user.genderPreference}\n`;

          // Check for confirmed needs coverage
          const confirmedNeedsCount = user.staffAllocations.reduce((sum, alloc) => sum + alloc.confirmedNeeds.length, 0);
          if (user.supportNeeds.length > 0) {
            data += `    - Support Needs Coverage: ${confirmedNeedsCount > 0 ? 'Partial/Full' : 'Not confirmed'}\n`;
          }
        });
        data += "\n";
      });

      // Service users without primary staff
      const usersWithoutPrimary = serviceUsers.filter(u => u.primaryStaffIds.length === 0);
      if (usersWithoutPrimary.length > 0) {
        data += `Service Users Without Primary Staff: ${usersWithoutPrimary.map(u => u.name).join(', ')}\n`;
      }
    }
    return data;
  };
  const generateAISummary = async () => {
    if (isLoading || isGenerating) return;
    if (!showUtilisation && !showMatchmaking) {
      toast({
        title: "No Data Selected",
        description: "Please enable at least one toggle (Utilisation Forecast or Matchmaking) to generate a summary.",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    try {
      const collectedData = collectForecastData();
      if (!collectedData.trim()) {
        toast({
          title: "No Data Found",
          description: "No forecast data available to summarize",
          variant: "destructive"
        });
        return;
      }
      let focusArea = "";
      if (showUtilisation && showMatchmaking) {
        focusArea = "both staff utilisation and matchmaking effectiveness";
      } else if (showUtilisation) {
        focusArea = "staff utilisation and resourcing levels";
      } else {
        focusArea = "staff matching effectiveness and coverage";
      }
      const messages = [{
        role: "system" as const,
        content: `You are an AI assistant that creates workforce planning summaries for care organizations. Create a concise, actionable summary focusing on ${focusArea}.

Instructions:
- Write a narrative summary in 250 words or less
- Start with an overall assessment of how well-resourced ${companyName} is for the next 8 weeks
- ${showUtilisation ? "Include insights on utilisation rates - highlight weeks with concerning utilisation (under 70% or over 90%)" : ""}
- ${showMatchmaking ? "Include assessment of staff-to-service-user matching effectiveness, coverage gaps, and location-based distribution" : ""}
- Highlight any critical gaps or risks
- Use professional, clear language suitable for care management
- Be specific about numbers and percentages where relevant
- End with 1-2 key recommendations
- Do not use bullet points, write in flowing paragraphs`
      }, {
        role: "user" as const,
        content: `Create a workforce planning summary for ${companyName} based on this forecast data:\n\n${collectedData}`
      }];
      const generatedSummary = await generateResponse(messages, 'gpt-4.1-2025-04-14');
      if (generatedSummary) {
        setSummary(generatedSummary);
        toast({
          title: "Summary Generated",
          description: "AI forecast summary has been generated successfully"
        });
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  return <Card className="mb-6 border border-border shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Summary</h3>
          <Button variant="outline" size="sm" onClick={generateAISummary} disabled={isLoading || isGenerating} className="gap-2 bg-primary/5">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {summary ? "Regenerate" : "Generate Summary"}
          </Button>
        </div>
        
        {summary ? <div className="prose prose-sm max-w-none text-muted-foreground">
            <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
          </div> : <p className="text-sm text-muted-foreground italic">
            Click "Generate Summary" to create an AI-powered analysis of your {showUtilisation && showMatchmaking ? "utilisation forecast and matchmaking data" : showUtilisation ? "utilisation forecast" : showMatchmaking ? "matchmaking data" : "forecast data (enable at least one toggle)"}.
          </p>}
      </CardContent>
    </Card>;
};