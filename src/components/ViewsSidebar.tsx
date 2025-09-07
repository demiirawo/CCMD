import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Folder,
  FolderPlus
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ViewCreateDialog } from './ViewCreateDialog';
import { ViewEditDialog } from './ViewEditDialog';

interface BaseView {
  id: string;
  name: string;
  filters: any;
  sorts: any;
  groups: any;
  visible_fields: any;
  settings: any;
  view_type: string;
  is_default: boolean;
  folder?: string;
}

interface ViewGroup {
  name: string;
  icon: React.ReactNode;
  views: BaseView[];
  isOpen: boolean;
}

interface ViewsSidebarProps {
  tableId: string;
  currentView: BaseView | null;
  onViewChange: (view: BaseView | null) => void;
  onCreateView: () => void;
}

export const ViewsSidebar: React.FC<ViewsSidebarProps> = ({
  tableId,
  currentView,
  onViewChange,
  onCreateView
}) => {
  const [views, setViews] = useState<BaseView[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingView, setEditingView] = useState<BaseView | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['General']));
  const { toast } = useToast();

  // Default view groups structure
  const defaultGroups = [
    { name: 'General', icon: <Eye className="w-4 h-4" /> },
    { name: 'Performance', icon: <Eye className="w-4 h-4" /> },
    { name: 'Training', icon: <Eye className="w-4 h-4" /> },
    { name: 'Compliance', icon: <Eye className="w-4 h-4" /> },
    { name: 'More collaborative views', icon: <Eye className="w-4 h-4" /> }
  ];

  const loadViews = async () => {
    try {
      const { data, error } = await supabase
        .from('base_views')
        .select('*')
        .eq('table_id', tableId)
        .order('name');

      if (error) throw error;
      const viewsWithFolders = (data || []).map(view => ({
        ...view,
        folder: (view.settings as any)?.folder || 'General'
      }));
      setViews(viewsWithFolders);
    } catch (error) {
      console.error('Error loading views:', error);
      toast({
        title: "Error",
        description: "Failed to load views",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableId) {
      loadViews();
    }
  }, [tableId]);

  const handleDeleteView = async (viewId: string) => {
    try {
      const { error } = await supabase
        .from('base_views')
        .delete()
        .eq('id', viewId);

      if (error) throw error;

      setViews(views.filter(v => v.id !== viewId));
      if (currentView?.id === viewId) {
        onViewChange(null);
      }

      toast({
        title: "Success",
        description: "View deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting view:', error);
      toast({
        title: "Error",
        description: "Failed to delete view",
        variant: "destructive",
      });
    }
  };

  const handleViewCreated = (newView: BaseView) => {
    setViews([...views, newView]);
    setShowCreateDialog(false);
    onViewChange(newView);
  };

  const handleViewUpdated = (updatedView: BaseView) => {
    setViews(views.map(v => v.id === updatedView.id ? updatedView : v));
    setEditingView(null);
    if (currentView?.id === updatedView.id) {
      onViewChange(updatedView);
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // Group views by folder
  const groupedViews: ViewGroup[] = defaultGroups.map(group => ({
    ...group,
    views: views.filter(view => (view.folder || 'General') === group.name),
    isOpen: expandedGroups.has(group.name)
  }));

  // Filter views based on search
  const filteredGroups = groupedViews.map(group => ({
    ...group,
    views: group.views.filter(view => 
      view.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.views.length > 0 || searchQuery === '');

  const renderViewItem = (view: BaseView) => (
    <div
      key={view.id}
      className={`flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent/50 ${
        currentView?.id === view.id ? 'bg-accent text-accent-foreground' : ''
      }`}
      onClick={() => onViewChange(view)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Eye className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{view.name}</span>
        {view.is_default && (
          <span className="text-xs text-muted-foreground">(Default)</span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditingView(view)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleDeleteView(view.id)}
            className="text-destructive"
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (loading) {
    return (
      <div className="w-64 border-r bg-background p-4">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-6 bg-muted rounded animate-pulse" />
          <div className="h-6 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="w-full justify-start text-left mb-3"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create new...
        </Button>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Find a view"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Views option */}
          <div
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent/50 mb-2 ${
              !currentView ? 'bg-accent text-accent-foreground' : ''
            }`}
            onClick={() => onViewChange(null)}
          >
            <Eye className="w-4 h-4" />
            <span>All Records</span>
          </div>

          {filteredGroups.map((group) => (
            <Collapsible
              key={group.name}
              open={group.isOpen}
              onOpenChange={() => toggleGroup(group.name)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium hover:bg-accent/50 rounded-md">
                <div className="flex items-center gap-2">
                  {group.isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Folder className="w-4 h-4" />
                  <span>{group.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {group.views.length}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-4 space-y-1">
                {group.views.map(renderViewItem)}
                {group.views.length === 0 && searchQuery && (
                  <p className="text-xs text-muted-foreground px-3 py-2">
                    No views found
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <ViewCreateDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        tableId={tableId}
        onViewCreated={handleViewCreated}
        availableFolders={defaultGroups.map(g => g.name)}
      />

      {editingView && (
        <ViewEditDialog
          isOpen={!!editingView}
          onClose={() => setEditingView(null)}
          view={editingView}
          onViewUpdated={handleViewUpdated}
          availableFolders={defaultGroups.map(g => g.name)}
        />
      )}
    </div>
  );
};