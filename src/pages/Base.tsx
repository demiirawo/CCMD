import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Table, Search, Filter, MoreHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface BaseTable {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
  record_count?: number;
}

export const Base = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<BaseTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (profile?.company_id) {
      fetchTables();
    }
  }, [profile?.company_id]);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('base_tables')
        .select(`
          *,
          base_records(count)
        `)
        .eq('company_id', profile?.company_id);

      if (error) throw error;

      const tablesWithCounts = data?.map(table => ({
        ...table,
        record_count: table.base_records?.[0]?.count || 0
      })) || [];

      setTables(tablesWithCounts);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Error",
        description: "Failed to load tables",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!profile?.company_id) return;

    try {
      const newTableName = `Table ${tables.length + 1}`;
      
      const { data: tableData, error: tableError } = await supabase
        .from('base_tables')
        .insert({
          company_id: profile.company_id,
          name: newTableName,
          description: 'A new table',
          icon: '📋',
          color: '#3b82f6'
        })
        .select()
        .single();

      if (tableError) throw tableError;

      // Create default fields
      const defaultFields = [
        { name: 'Name', field_type: 'single_line', position: 0, is_required: true },
        { name: 'Notes', field_type: 'long_text', position: 1 },
        { name: 'Status', field_type: 'single_select', position: 2, field_config: { 
          options: [
            { id: '1', name: 'Active', color: '#10b981' },
            { id: '2', name: 'Inactive', color: '#6b7280' }
          ]
        }}
      ];

      const { error: fieldsError } = await supabase
        .from('base_fields')
        .insert(
          defaultFields.map(field => ({
            table_id: tableData.id,
            ...field
          }))
        );

      if (fieldsError) throw fieldsError;

      // Create default view
      const { error: viewError } = await supabase
        .from('base_views')
        .insert({
          table_id: tableData.id,
          name: 'Grid View',
          view_type: 'grid',
          is_default: true
        });

      if (viewError) throw viewError;

      toast({
        title: "Success",
        description: "Table created successfully"
      });

      fetchTables();
    } catch (error) {
      console.error('Error creating table:', error);
      toast({
        title: "Error",
        description: "Failed to create table",
        variant: "destructive"
      });
    }
  };

  const openTable = (tableId: string) => {
    navigate(`/base/table/${tableId}`);
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 pt-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Base</h1>
              <p className="text-muted-foreground">Organize and manage your data in flexible tables</p>
            </div>
            <Button onClick={createTable} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Table
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Tables Grid */}
        {filteredTables.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Table className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">
                {tables.length === 0 ? "No tables yet" : "No tables found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {tables.length === 0 
                  ? "Create your first table to start organizing your data"
                  : "Try adjusting your search criteria"
                }
              </p>
              {tables.length === 0 && (
                <Button onClick={createTable} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Table
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <Card 
                key={table.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => openTable(table.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg"
                        style={{ backgroundColor: table.color }}
                      >
                        {table.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium truncate">
                          {table.name}
                        </CardTitle>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          openTable(table.id);
                        }}>Open</DropdownMenuItem>
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {table.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{table.record_count || 0} records</span>
                    <span>
                      {new Date(table.updated_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};