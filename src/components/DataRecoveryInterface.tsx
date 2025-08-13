import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnhancedAutoBackup } from '@/hooks/useEnhancedAutoBackup';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { 
  Clock, 
  Database, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle, 
  RotateCcw,
  Download,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DataRecoveryInterfaceProps {
  onRestore: (data: any) => void;
  currentMeetingId?: string;
}

export const DataRecoveryInterface: React.FC<DataRecoveryInterfaceProps> = ({
  onRestore,
  currentMeetingId
}) => {
  const { profile } = useAuth();
  const { getAvailableBackups, getLocalStorageBackups, restoreFromBackup } = useEnhancedAutoBackup();
  
  const [databaseBackups, setDatabaseBackups] = useState<any[]>([]);
  const [localBackups, setLocalBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBackup, setSelectedBackup] = useState<any>(null);

  // Load backups on mount
  useEffect(() => {
    const loadBackups = async () => {
      setLoading(true);
      try {
        const [dbBackups, localBkps] = await Promise.all([
          getAvailableBackups(currentMeetingId),
          Promise.resolve(getLocalStorageBackups())
        ]);
        
        setDatabaseBackups(dbBackups);
        setLocalBackups(localBkps);
      } catch (error) {
        console.error('Failed to load backups:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBackups();
  }, [getAvailableBackups, getLocalStorageBackups, currentMeetingId]);

  // Filter backups based on search
  const filteredDbBackups = databaseBackups.filter(backup => 
    backup.meeting_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    backup.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLocalBackups = localBackups.filter(backup =>
    backup.meetingId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestore = async (backup: any, isLocal: boolean = false) => {
    try {
      let data;
      
      if (isLocal) {
        data = backup.data;
      } else {
        data = await restoreFromBackup(backup.id);
      }
      
      if (data) {
        onRestore(data);
        setSelectedBackup(null);
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'auto': return 'bg-blue-100 text-blue-800';
      case 'manual': return 'bg-green-100 text-green-800';
      case 'checkpoint': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const BackupCard = ({ backup, isLocal = false }: { backup: any; isLocal?: boolean }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {isLocal ? <HardDrive className="h-4 w-4" /> : <Database className="h-4 w-4" />}
            {isLocal ? `Local: ${backup.meetingId}` : `Meeting: ${backup.meeting_id}`}
          </CardTitle>
          <Badge className={getBackupTypeColor(backup.backup_type || 'local')}>
            {backup.backup_type || 'local'}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(backup.timestamp || backup.created_at), 'MMM dd, yyyy HH:mm')}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {backup.metadata?.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {backup.metadata.description}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setSelectedBackup({ ...backup, isLocal })}
            variant="outline"
          >
            <Search className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={() => handleRestore(backup, isLocal)}
            className="bg-primary hover:bg-primary/90"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restore
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const BackupPreview = ({ backup }: { backup: any }) => {
    const data = backup.isLocal ? backup.data : backup.backup_data;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Backup Preview
          </CardTitle>
          <CardDescription>
            Review backup contents before restoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Dashboard Data</h4>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                {data?.dashboardData ? 
                  `${Object.keys(data.dashboardData).length} sections` : 
                  'No dashboard data'
                }
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Actions Log</h4>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                {data?.actionsLog?.length || 0} actions
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Key Documents</h4>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                {data?.keyDocuments?.length || 0} documents
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleRestore(backup, backup.isLocal)}
                className="bg-primary hover:bg-primary/90"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirm Restore
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedBackup(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading recovery options...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Data Recovery Interface
          </CardTitle>
          <CardDescription>
            Recover lost data from automatic backups and checkpoints
          </CardDescription>
        </CardHeader>
      </Card>

      {selectedBackup ? (
        <BackupPreview backup={selectedBackup} />
      ) : (
        <>
          <div className="space-y-2">
            <Input
              placeholder="Search backups by meeting ID or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <Tabs defaultValue="database" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database Backups ({filteredDbBackups.length})
              </TabsTrigger>
              <TabsTrigger value="local" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Local Backups ({filteredLocalBackups.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="database" className="mt-4">
              <ScrollArea className="h-96">
                {filteredDbBackups.length > 0 ? (
                  filteredDbBackups.map((backup) => (
                    <BackupCard key={backup.id} backup={backup} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No database backups found
                    </CardContent>
                  </Card>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="local" className="mt-4">
              <ScrollArea className="h-96">
                {filteredLocalBackups.length > 0 ? (
                  filteredLocalBackups.map((backup, index) => (
                    <BackupCard key={index} backup={backup} isLocal />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No local backups found
                    </CardContent>
                  </Card>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};