import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Copy, Download, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface TableHistoryDialogProps {
  tableId: string;
  tableName: string;
  onRestoreCallback?: () => void;
}

interface TableBackup {
  id: string;
  created_at: string;
  backup_data: any;
  backup_type: string;
  meeting_date?: string;
  metadata?: any;
}

export const TableHistoryDialog = ({ tableId, tableName, onRestoreCallback }: TableHistoryDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [backups, setBackups] = useState<TableBackup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const loadBackups = async () => {
    if (!profile?.company_id || !tableId) return;
    
    setLoading(true);
    try {
      // Get table backups - note: we're looking for table-specific backups
      const { data, error } = await supabase
        .from('meeting_backups')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('data_type', 'table')
        .order('created_at', { ascending: false })
        .limit(30); // Show last 30 backups

      if (error) throw error;

      // Filter backups that contain our table data
      const tableBackups = (data || []).filter(backup => {
        if (!backup.backup_data || typeof backup.backup_data !== 'object') return false;
        const backupData = backup.backup_data as any;
        return backupData.tables && backupData.tables[tableId];
      });

      setBackups(tableBackups);
    } catch (error) {
      console.error('Error loading table backups:', error);
      toast({
        title: "Error",
        description: "Failed to load table history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createHistoricalCopy = async (backup: TableBackup) => {
    if (!profile?.company_id) return;

    setCreating(true);
    try {
      const backupData = backup.backup_data as any;
      const tableData = backupData.tables?.[tableId];
      if (!tableData) {
        throw new Error('Table data not found in backup');
      }

      // Create a new table with historical data
      const backupDate = format(new Date(backup.created_at), 'yyyy-MM-dd');
      const historicalTableName = `${tableName} (${backupDate})`;

      // Create the new table
      const { data: newTable, error: tableError } = await supabase
        .from('base_tables')
        .insert({
          company_id: profile.company_id,
          name: historicalTableName,
          description: `Historical copy from ${backupDate}`,
          icon: '📋',
          color: '#6b7280',
          created_by: profile.user_id
        })
        .select()
        .single();

      if (tableError) throw tableError;

      // Create fields
      if (tableData.fields && tableData.fields.length > 0) {
        const fieldsToInsert = tableData.fields.map((field: any, index: number) => ({
          table_id: newTable.id,
          name: field.name,
          field_type: field.field_type,
          field_config: field.field_config || {},
          is_required: field.is_required || false,
          position: index
        }));

        const { error: fieldsError } = await supabase
          .from('base_fields')
          .insert(fieldsToInsert);

        if (fieldsError) throw fieldsError;
      }

      // Create records
      if (tableData.records && tableData.records.length > 0) {
        const recordsToInsert = tableData.records.map((record: any) => ({
          table_id: newTable.id,
          data: record.data || {},
          created_by: profile.user_id
        }));

        const { error: recordsError } = await supabase
          .from('base_records')
          .insert(recordsToInsert);

        if (recordsError) throw recordsError;
      }

      toast({
        title: "Success",
        description: `Historical copy "${historicalTableName}" created successfully`,
      });

      setIsOpen(false);
      if (onRestoreCallback) {
        onRestoreCallback();
      }
    } catch (error) {
      console.error('Error creating historical copy:', error);
      toast({
        title: "Error",
        description: "Failed to create historical copy",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen, profile?.company_id, tableId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Table History - "{tableName}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="text-sm text-muted-foreground">
            View and restore from daily backups of your table data.
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backup history found for this table.</p>
              <p className="text-sm mt-2">Backups are created automatically during meetings.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="space-y-3">
                {backups.map((backup) => {
                  const backupDate = new Date(backup.created_at);
                  const backupData = backup.backup_data as any;
                  const tableData = backupData.tables?.[tableId];
                  const recordCount = tableData?.records?.length || 0;
                  const fieldCount = tableData?.fields?.length || 0;

                  return (
                    <div
                      key={backup.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(backupDate, 'PPP')}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              at {format(backupDate, 'p')}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {backup.backup_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {recordCount} records, {fieldCount} fields
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => createHistoricalCopy(backup)}
                            disabled={creating}
                            className="gap-2"
                          >
                            <Copy className="h-3 w-3" />
                            Create Copy
                          </Button>
                        </div>
                      </div>
                      
                      {backup.meeting_date && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Meeting: {backup.meeting_date}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};