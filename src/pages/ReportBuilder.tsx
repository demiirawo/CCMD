import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";
export const ReportBuilder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const quarter = searchParams.get('quarter') || '';
  const year = searchParams.get('year') || '';
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [additionalContext, setAdditionalContext] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
      toast({
        title: "Files Added",
        description: `${newFiles.length} file(s) added to the report context`
      });
    }
  };
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  const handleGenerateReport = () => {
    console.log('🚀 Generate Report with AI button clicked!');
    console.log('📝 Additional context:', additionalContext);
    console.log('📎 Attachments:', attachments.length);
    console.log('📅 Quarter:', quarter);
    console.log('📅 Year:', year);

    // Validate that we have quarter and year
    if (!quarter || !year) {
      console.error('❌ Missing quarter or year parameters');
      toast({
        title: "Missing Information",
        description: "Quarter and year are required to generate a report",
        variant: "destructive"
      });
      return;
    }

    // Navigate to generation process with additional context
    const contextData = {
      additionalContext,
      attachments: attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    };
    console.log('📊 Context data:', contextData);
    try {
      const encodedContext = encodeURIComponent(JSON.stringify(contextData));
      const targetUrl = `/quarterly-report?quarter=${quarter}&year=${year}&generate=true&context=${encodedContext}`;
      console.log('🎯 Navigating to:', targetUrl);
      navigate(targetUrl);
      console.log('✅ Navigation call completed');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate to report generation",
        variant: "destructive"
      });
    }
  };
  const handleBack = () => {
    navigate('/reports');
  };
  return <>
      <Navigation />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            
            Back to Reports
          </Button>
          
          <h1 className="text-3xl font-bold mb-2 bg-stone-50">Build Quarterly Report</h1>
          
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Additional Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="context">
                  Provide additional information to help the AI generate a more comprehensive report
                </Label>
                <Textarea id="context" placeholder="Enter any additional context, specific areas to focus on, recent developments, or special considerations that should be included in the quarterly report..." value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} className="min-h-[120px]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Supporting Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="attachments">
                    Upload documents, reports, or other files to provide additional context
                  </Label>
                  <input id="attachments" type="file" multiple onChange={handleFileUpload} className="mt-2 block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90" accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls" />
                </div>

                {attachments.length > 0 && <div className="space-y-2">
                    <Label>Attached Files:</Label>
                    <div className="space-y-2">
                      {attachments.map((file, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>)}
                    </div>
                  </div>}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport}>
              Generate Report with AI
            </Button>
          </div>
        </div>
      </div>
    </>;
};
export default ReportBuilder;