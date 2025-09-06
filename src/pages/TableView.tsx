import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Plus, 
  Filter, 
  ArrowUpDown as Sort, 
  Search,
  MoreHorizontal 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BaseField {
  id: string;
  name: string;
  field_type: string;
  field_config: any;
  is_required: boolean;
  position: number;
}

interface BaseRecord {
  id: string;
  data: any;
  created_at: string;
  updated_at: string;
}

interface BaseTableData {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
}

export const TableView = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [table, setTable] = useState<BaseTableData | null>(null);
  const [fields, setFields] = useState<BaseField[]>([]);
  const [records, setRecords] = useState<BaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (tableId && profile?.company_id) {
      loadTableData();
    }
  }, [tableId, profile?.company_id]);

  const loadTableData = async () => {
    try {
      // Load table info
      const { data: tableData, error: tableError } = await supabase
        .from('base_tables')
        .select('*')
        .eq('id', tableId)
        .eq('company_id', profile?.company_id)
        .single();

      if (tableError) {
        if (tableError.code === 'PGRST116') {
          toast({
            title: "Table not found",
            description: "This table doesn't exist or you don't have access to it",
            variant: "destructive"
          });
          navigate('/base');
          return;
        }
        throw tableError;
      }

      setTable(tableData);

      // Load fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('base_fields')
        .select('*')
        .eq('table_id', tableId)
        .order('position');

      if (fieldsError) throw fieldsError;
      setFields(fieldsData || []);

      // Load records
      const { data: recordsData, error: recordsError } = await supabase
        .from('base_records')
        .select('*')
        .eq('table_id', tableId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;
      setRecords(recordsData || []);

    } catch (error) {
      console.error('Error loading table data:', error);
      toast({
        title: "Error",
        description: "Failed to load table data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async () => {
    if (!tableId || !profile?.company_id) return;

    try {
      // Create a new empty record with default values
      const defaultData: Record<string, any> = {};
      fields.forEach(field => {
        if (field.field_type === 'single_line') {
          defaultData[field.id] = '';
        } else if (field.field_type === 'checkbox') {
          defaultData[field.id] = false;
        } else if (field.field_type === 'single_select') {
          defaultData[field.id] = null;
        } else {
          defaultData[field.id] = '';
        }
      });

      const { data, error } = await supabase
        .from('base_records')
        .insert({
          table_id: tableId,
          data: defaultData
        })
        .select()
        .single();

      if (error) throw error;

      setRecords([data, ...records]);
      
      toast({
        title: "Success",
        description: "New record added"
      });
    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: "Error",
        description: "Failed to add record",
        variant: "destructive"
      });
    }
  };

  const renderCellValue = (field: BaseField, value: any) => {
    switch (field.field_type) {
      case 'single_line':
        return value || '';
      case 'long_text':
        return value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '';
      case 'checkbox':
        return value ? '✓' : '';
      case 'single_select':
        if (value && field.field_config?.options) {
          const option = field.field_config.options.find((opt: any) => opt.id === value);
          return option ? (
            <span 
              className="px-2 py-1 rounded text-xs text-white"
              style={{ backgroundColor: option.color }}
            >
              {option.name}
            </span>
          ) : '';
        }
        return '';
      default:
        return value ? String(value) : '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-background p-6 pt-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-semibold mb-4">Table not found</h1>
          <Button onClick={() => navigate('/base')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Base
          </Button>
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
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/base')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg"
                  style={{ backgroundColor: table.color }}
                >
                  {table.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{table.name}</h1>
                  <p className="text-sm text-muted-foreground">{records.length} records</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Sort className="h-4 w-4" />
                Sort
              </Button>
              <Button onClick={addRecord} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {fields.map((field) => (
                  <TableHead key={field.id} className="font-medium">
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={fields.length + 1} 
                    className="text-center py-12 text-muted-foreground"
                  >
                    No records yet. Click "Add Record" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    {fields.map((field) => (
                      <TableCell key={field.id} className="py-3">
                        {renderCellValue(field, record.data[field.id])}
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};