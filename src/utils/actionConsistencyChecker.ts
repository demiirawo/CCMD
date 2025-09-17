import { supabase } from "@/integrations/supabase/client";

export interface ConsistencyResult {
  actionId: string;
  subsectionOwner?: string;
  logOwner?: string;
  subsectionDate?: string;
  logDate?: string;
  subsectionDescription?: string;
  logDescription?: string;
  logStatus?: string;
  logClosed?: boolean;
  issues: string[];
  location: 'subsection' | 'actions_log' | 'both';
}

export async function checkActionConsistency(companyId: string): Promise<{
  results: ConsistencyResult[];
  summary: {
    totalSubsectionActions: number;
    totalLogActions: number;
    consistentActions: number;
    inconsistentActions: number;
    orphanedSubsectionActions: number;
    orphanedLogActions: number;
  };
}> {
  try {
    console.log('🔍 Starting action consistency check for company:', companyId);
    // Get all subsection actions
    const { data: subsectionData, error: subsectionError } = await supabase
      .from('subsection_data')
      .select('section_id, item_id, actions')
      .eq('company_id', companyId)
      .not('actions', 'is', null);

    if (subsectionError) {
      throw new Error(`Error fetching subsection data: ${subsectionError.message}`);
    }

    // Get all actions_log entries
    const { data: logData, error: logError } = await supabase
      .from('actions_log')
      .select('action_id, mentioned_attendee, action_text, due_date, status, closed, source_id')
      .eq('company_id', companyId);

    if (logError) {
      throw new Error(`Error fetching actions log: ${logError.message}`);
    }

    console.log('📊 Subsection data found:', subsectionData?.length || 0, 'rows');

    // Parse subsection actions
    const subsectionActions: { [key: string]: any } = {};
    let totalSubsectionActions = 0;

    subsectionData?.forEach((row, rowIndex) => {
      if (row.actions && Array.isArray(row.actions)) {
        console.log(`📝 Row ${rowIndex} (section: ${row.section_id}, item: ${row.item_id}) has ${row.actions.length} actions:`);
        row.actions.forEach((action: any, actionIndex) => {
          console.log(`  Action ${actionIndex}:`, {
            id: action?.id,
            description: action?.description,
            name: action?.name,
            targetDate: action?.targetDate
          });
          if (action && action.id) {
            totalSubsectionActions++;
            subsectionActions[action.id] = {
              ...action,
              sectionId: row.section_id,
              itemId: row.item_id
            };
            // Special logging for the mentioned action
            if (action.description?.toLowerCase().includes('hauwa') || 
                action.description?.toLowerCase().includes('inventory')) {
              console.log('🎯 Found Hauwa inventory action in subsection:', action);
            }
          }
        });
      }
    });

    console.log('📈 Total subsection actions found:', totalSubsectionActions);
    console.log('🔑 Subsection action IDs:', Object.keys(subsectionActions));

    console.log('📋 Actions log data found:', logData?.length || 0, 'entries');

    // Create lookup for log actions
    const logActions: { [key: string]: any } = {};
    let totalLogActions = 0;

    logData?.forEach((action, index) => {
      if (action.action_id) {
        totalLogActions++;
        logActions[action.action_id] = action;
        // Special logging for the mentioned action
        if (action.action_text?.toLowerCase().includes('hauwa') || 
            action.action_text?.toLowerCase().includes('inventory')) {
          console.log('🎯 Found Hauwa inventory action in log:', action);
        }
      }
    });

    console.log('📊 Total log actions found:', totalLogActions);
    console.log('🔑 Log action IDs:', Object.keys(logActions));

    // Compare actions
    const results: ConsistencyResult[] = [];
    const allActionIds = new Set([
      ...Object.keys(subsectionActions),
      ...Object.keys(logActions)
    ]);

    console.log('🔄 Starting comparison for', allActionIds.size, 'unique action IDs');

    allActionIds.forEach((actionId) => {
      const subsectionAction = subsectionActions[actionId];
      const logAction = logActions[actionId];
      const issues: string[] = [];

      // Debug logging for specific actions
      if (actionId.includes('hauwa') || 
          subsectionAction?.description?.toLowerCase().includes('hauwa') ||
          logAction?.action_text?.toLowerCase().includes('hauwa') ||
          subsectionAction?.description?.toLowerCase().includes('inventory') ||
          logAction?.action_text?.toLowerCase().includes('inventory')) {
        console.log('🎯 Comparing Hauwa/inventory action:', {
          actionId,
          hasSubsection: !!subsectionAction,
          hasLog: !!logAction,
          subsectionData: subsectionAction,
          logData: logAction
        });
      }

      let location: 'subsection' | 'actions_log' | 'both' = 'both';
      if (subsectionAction && !logAction) {
        location = 'subsection';
        issues.push('Action exists in subsection but not in actions log');
        console.log('⚠️ Orphaned subsection action:', actionId, subsectionAction?.description);
      } else if (!subsectionAction && logAction) {
        location = 'actions_log';
        // If action is closed, it's correct that it only exists in the log
        if (!logAction.closed) {
          issues.push('Action exists in actions log but not in subsection');
          console.log('⚠️ Orphaned log action:', actionId, logAction?.action_text);
        }
      }

      // Check for inconsistencies if action exists in both places
      if (subsectionAction && logAction) {
        // If action is closed, it shouldn't be in subsections at all
        if (logAction.closed) {
          issues.push('Closed action should only exist in actions log, not in subsection');
        } else {
          // Only check for other inconsistencies if action is not closed
          if (subsectionAction.name !== logAction.mentioned_attendee) {
            issues.push(`Owner mismatch: subsection="${subsectionAction.name}" vs log="${logAction.mentioned_attendee}"`);
          }
          
          if (subsectionAction.targetDate !== logAction.due_date) {
            issues.push(`Date mismatch: subsection="${subsectionAction.targetDate}" vs log="${logAction.due_date}"`);
          }
          
          if (subsectionAction.description !== logAction.action_text) {
            issues.push(`Description mismatch: subsection="${subsectionAction.description}" vs log="${logAction.action_text}"`);
          }
        }
      }

      results.push({
        actionId,
        subsectionOwner: subsectionAction?.name,
        logOwner: logAction?.mentioned_attendee,
        subsectionDate: subsectionAction?.targetDate,
        logDate: logAction?.due_date,
        subsectionDescription: subsectionAction?.description,
        logDescription: logAction?.action_text,
        logStatus: logAction?.status,
        logClosed: logAction?.closed,
        issues,
        location
      });
    });

    // Calculate summary
    const consistentActions = results.filter(r => r.issues.length === 0).length;
    const inconsistentActions = results.filter(r => r.issues.length > 0 && r.location === 'both').length;
    const orphanedSubsectionActions = results.filter(r => r.location === 'subsection').length;
    // Only count log-only actions as orphaned if they're not closed (closed actions should only be in log)
    const orphanedLogActions = results.filter(r => r.location === 'actions_log' && r.issues.length > 0).length;

    return {
      results: results.sort((a, b) => b.issues.length - a.issues.length), // Sort by most issues first
      summary: {
        totalSubsectionActions,
        totalLogActions,
        consistentActions,
        inconsistentActions,
        orphanedSubsectionActions,
        orphanedLogActions
      }
    };

  } catch (error) {
    console.error('Error checking action consistency:', error);
    throw error;
  }
}