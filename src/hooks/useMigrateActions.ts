import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useMigrateActions = () => {
  const { profile } = useAuth();

  const migrateSubsectionActions = useCallback(async () => {
    if (!profile?.company_id) return;

    try {
      // Get all subsection_data with actions
      const { data: subsections, error: fetchError } = await supabase
        .from('subsection_data')
        .select('*')
        .eq('company_id', profile.company_id)
        .not('actions', 'is', null);

      if (fetchError) {
        console.error('Error fetching subsections:', fetchError);
        return;
      }

      for (const subsection of subsections || []) {
        if (subsection.actions && Array.isArray(subsection.actions) && subsection.actions.length > 0) {
          console.log('Migrating actions from subsection:', subsection.item_id, 'actions:', subsection.actions);
          
          // Convert subsection actions to actions_log format
          const actionsToInsert = subsection.actions.map((action: any) => ({
            action_id: action.id || `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            company_id: profile.company_id,
            item_title: subsection.item_id || 'Migrated Item',
            mentioned_attendee: action.name || 'Unknown',
            comment: action.comment || '',
            action_text: action.description || action.action_text || '',
            due_date: action.targetDate || action.due_date || '',
            status: 'green',
            closed: false,
            source_type: 'manual',
            source_id: subsection.item_id || '',
            session_id: subsection.session_id || '',
            timestamp: new Date().toISOString(),
            audit_trail: action.auditTrail || []
          }));

          // Check if actions already exist in actions_log
          for (const actionToInsert of actionsToInsert) {
            const { data: existing } = await supabase
              .from('actions_log')
              .select('id')
              .eq('action_id', actionToInsert.action_id)
              .maybeSingle();

            if (!existing) {
              // Insert action into actions_log
              const { error: insertError } = await supabase
                .from('actions_log')
                .insert(actionToInsert);

              if (insertError) {
                console.error('Error inserting action:', insertError);
              } else {
                console.log('Successfully migrated action:', actionToInsert.action_id);
              }
            } else {
              console.log('Action already exists:', actionToInsert.action_id);
            }
          }

          // Clear actions from subsection_data
          const { error: updateError } = await supabase
            .from('subsection_data')
            .update({ actions: [] })
            .eq('id', subsection.id);

          if (updateError) {
            console.error('Error clearing subsection actions:', updateError);
          }
        }
      }

      toast({
        title: "Actions migrated",
        description: "All subsection actions have been moved to the unified system",
      });

    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Migration error",
        description: "There was an error migrating actions",
        variant: "destructive"
      });
    }
  }, [profile?.company_id]);

  return { migrateSubsectionActions };
};