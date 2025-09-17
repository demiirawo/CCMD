import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Search, RefreshCw, Trash2, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { checkActionConsistency, ConsistencyResult } from "@/utils/actionConsistencyChecker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "./ui/alert";

export const ActionConsistencyReport = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [results, setResults] = useState<{
    results: ConsistencyResult[];
    summary: any;
  } | null>(null);

  const runConsistencyCheck = async () => {
    if (!profile?.company_id) {
      toast({
        title: "Error",
        description: "No company selected",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    try {
      const consistencyResults = await checkActionConsistency(profile.company_id);
      setResults(consistencyResults);
      
      const { summary } = consistencyResults;
      const hasIssues = summary.inconsistentActions + summary.orphanedSubsectionActions + summary.orphanedLogActions > 0;
      
      toast({
        title: hasIssues ? "Consistency Issues Found" : "All Actions Consistent",
        description: hasIssues 
          ? `Found ${summary.inconsistentActions + summary.orphanedSubsectionActions + summary.orphanedLogActions} issues to review`
          : "All actions are properly synchronized between subsections and actions log",
        variant: hasIssues ? "destructive" : "default"
      });
    } catch (error) {
      console.error('Consistency check failed:', error);
      toast({
        title: "Check Failed",
        description: "Failed to run consistency check. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const markOrphanedActionsComplete = async () => {
    if (!profile?.company_id || !results) {
      toast({
        title: "Error",
        description: "No company selected or no results available",
        variant: "destructive"
      });
      return;
    }

    // Find orphaned actions in the log (actions that exist only in log and are not closed)
    const orphanedLogActions = results.results.filter(result => 
      result.location === 'actions_log' && 
      result.issues.some(issue => issue.includes('Action exists in actions log but not in subsection')) &&
      !result.logClosed
    );

    if (orphanedLogActions.length === 0) {
      toast({
        title: "No Orphaned Actions",
        description: "No orphaned actions found to mark as complete.",
        variant: "default"
      });
      return;
    }

    // Show confirmation
    const confirmed = window.confirm(
      `Are you sure you want to mark ${orphanedLogActions.length} orphaned actions as complete?\n\n` +
      "This will close actions that exist in the actions log but cannot be found in any subsection. " +
      "Closed actions will no longer appear as orphaned in future consistency checks."
    );

    if (!confirmed) {
      return;
    }

    setIsCompleting(true);
    try {
      // Mark orphaned actions as closed/complete
      const actionIds = orphanedLogActions.map(action => action.actionId);
      
      const { error } = await supabase
        .from('actions_log')
        .update({ 
          closed: true,
          closed_date: new Date().toISOString().split('T')[0], // Today's date
          status: 'complete'
        })
        .eq('company_id', profile.company_id)
        .in('action_id', actionIds)
        .eq('closed', false); // Only mark non-closed actions

      if (error) {
        throw error;
      }

      toast({
        title: "Actions Marked Complete",
        description: `Successfully marked ${actionIds.length} orphaned actions as complete.`,
        variant: "default"
      });

      // Re-run consistency check to update results
      await runConsistencyCheck();

    } catch (error) {
      console.error('Failed to mark orphaned actions as complete:', error);
      toast({
        title: "Completion Failed",
        description: "Failed to mark orphaned actions as complete. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const removeOrphanedActions = async () => {
    if (!profile?.company_id || !results) {
      toast({
        title: "Error",
        description: "No company selected or no results available",
        variant: "destructive"
      });
      return;
    }

    // Find orphaned actions in the log (actions that exist only in log and are not closed)
    const orphanedLogActions = results.results.filter(result => 
      result.location === 'actions_log' && 
      result.issues.some(issue => issue.includes('Action exists in actions log but not in subsection')) &&
      !result.logClosed
    );

    if (orphanedLogActions.length === 0) {
      toast({
        title: "No Orphaned Actions",
        description: "No orphaned actions found to remove.",
        variant: "default"
      });
      return;
    }

    // Show confirmation
    const confirmed = window.confirm(
      `Are you sure you want to permanently remove ${orphanedLogActions.length} orphaned actions from the actions log?\n\n` +
      "This will delete actions that exist in the actions log but cannot be found in any subsection and are not closed. This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setIsCleaning(true);
    try {
      // Remove orphaned actions from the actions_log table
      const actionIds = orphanedLogActions.map(action => action.actionId);
      
      const { error } = await supabase
        .from('actions_log')
        .delete()
        .eq('company_id', profile.company_id)
        .in('action_id', actionIds)
        .eq('closed', false); // Only remove non-closed actions

      if (error) {
        throw error;
      }

      toast({
        title: "Cleanup Successful",
        description: `Removed ${actionIds.length} orphaned actions from the actions log.`,
        variant: "default"
      });

      // Re-run consistency check to update results
      await runConsistencyCheck();

    } catch (error) {
      console.error('Failed to remove orphaned actions:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to remove orphaned actions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const getLocationBadge = (location: string) => {
    switch (location) {
      case 'both':
        return <Badge variant="default">Both</Badge>;
      case 'subsection':
        return <Badge variant="destructive">Subsection Only</Badge>;
      case 'actions_log':
        return <Badge variant="secondary">Actions Log Only</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (issues: string[]) => {
    return issues.length === 0 ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Action Consistency Checker
          </CardTitle>
          <CardDescription>
            Verify that actions in subsections match those in the actions log for dates, statuses, and owners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={runConsistencyCheck} 
                disabled={isChecking || isCleaning || isCompleting}
                className="flex-1 min-w-[200px]"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking Consistency...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Run Consistency Check
                  </>
                )}
              </Button>
              
              {results && results.summary.orphanedLogActions > 0 && (
                <>
                  <Button 
                    onClick={markOrphanedActionsComplete} 
                    disabled={isChecking || isCleaning || isCompleting}
                    variant="default"
                    className="flex-1 min-w-[200px]"
                  >
                    {isCompleting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Marking Complete...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Complete ({results.summary.orphanedLogActions})
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={removeOrphanedActions} 
                    disabled={isChecking || isCleaning || isCompleting}
                    variant="destructive"
                    className="flex-1 min-w-[200px]"
                  >
                    {isCleaning ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Orphaned ({results.summary.orphanedLogActions})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
            
            {results && results.summary.orphanedLogActions > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cleanup Options:</strong>
                  <br />
                  • <strong>Mark as Complete:</strong> Safer option - closes orphaned actions so they won't appear as issues in future checks
                  <br />
                  • <strong>Delete Orphaned:</strong> Permanent removal - completely deletes orphaned action records from the database
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Subsection Actions</div>
                  <div className="text-2xl font-bold">{results.summary.totalSubsectionActions}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Actions Log Entries</div>
                  <div className="text-2xl font-bold">{results.summary.totalLogActions}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Consistent</div>
                  <div className="text-2xl font-bold text-green-600">{results.summary.consistentActions}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Inconsistent</div>
                  <div className="text-2xl font-bold text-red-600">{results.summary.inconsistentActions}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Orphaned Subsection</div>
                  <div className="text-2xl font-bold text-amber-600">{results.summary.orphanedSubsectionActions}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Orphaned Log</div>
                  <div className="text-2xl font-bold text-amber-600">{results.summary.orphanedLogActions}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>
                {results.results.length} actions analyzed. Issues are shown in detail below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No actions found to analyze.
                  </div>
                ) : (
                  results.results.map((result) => (
                    <div key={result.actionId} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.issues)}
                          <code className="text-sm font-mono">{result.actionId}</code>
                          {getLocationBadge(result.location)}
                        </div>
                        {result.logStatus && (
                          <Badge variant={result.logClosed ? "secondary" : "default"}>
                            {result.logClosed ? "Closed" : result.logStatus}
                          </Badge>
                        )}
                      </div>

                      {result.issues.length > 0 && (
                        <div className="space-y-1">
                          <div className="font-medium text-sm text-red-600">Issues:</div>
                          {result.issues.map((issue, index) => (
                            <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {issue}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-muted-foreground">Subsection Data:</div>
                          <div className="space-y-1 bg-gray-50 p-2 rounded">
                            <div><span className="font-medium">Owner:</span> {result.subsectionOwner || 'N/A'}</div>
                            <div><span className="font-medium">Date:</span> {result.subsectionDate || 'N/A'}</div>
                            <div><span className="font-medium">Description:</span> {result.subsectionDescription || 'N/A'}</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Actions Log Data:</div>
                          <div className="space-y-1 bg-blue-50 p-2 rounded">
                            <div><span className="font-medium">Owner:</span> {result.logOwner || 'N/A'}</div>
                            <div><span className="font-medium">Date:</span> {result.logDate || 'N/A'}</div>
                            <div><span className="font-medium">Description:</span> {result.logDescription || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};