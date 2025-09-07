import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from '@supabase/supabase-js';

interface TableData {
  table: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  };
  fields: Array<{
    id: string;
    name: string;
    field_type: string;
    field_config?: any;
  }>;
  records: Array<{
    id: string;
    data: Record<string, any>;
  }>;
}

export const PublicTable = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTableData();
  }, [tableId]);

  const loadTableData = async () => {
    if (!tableId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create anonymous supabase client for public access
      const anonClient = createClient(
        'https://gwywpkhxpbokmbhwsnod.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eXdwa2h4cGJva21iaHdzbm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjEyODcsImV4cCI6MjA2ODkzNzI4N30.ZpFRdjvGv75scJBqwnnMdClJSKTOgwM0A9rJaUbyHoU'
      );

      console.log('Loading table data for ID:', tableId);

      // Load table info (using anonymous client)
      const { data: tableInfo, error: tableError } = await anonClient
        .from('base_tables')
        .select('id, name, description, icon, color')
        .eq('id', tableId)
        .maybeSingle();

      console.log('Table query result:', { tableInfo, tableError });

      if (tableError) {
        console.error('Table error:', tableError);
        throw new Error(`Database error: ${tableError.message}`);
      }

      if (!tableInfo) {
        throw new Error('Table not found');
      }

      // Load fields
      const { data: fields, error: fieldsError } = await anonClient
        .from('base_fields')
        .select('*')
        .eq('table_id', tableId)
        .order('position');

      console.log('Fields query result:', { fields, fieldsError });

      if (fieldsError) {
        console.error('Fields error:', fieldsError);
        throw fieldsError;
      }

      // Load records
      const { data: records, error: recordsError } = await anonClient
        .from('base_records')
        .select('*')
        .eq('table_id', tableId)
        .is('deleted_at', null)
        .order('position');

      console.log('Records query result:', { records, recordsError });

      if (recordsError) {
        console.error('Records error:', recordsError);
        throw recordsError;
      }

      setTableData({
        table: tableInfo,
        fields: fields || [],
        records: (records || []).map(record => ({
          id: record.id,
          data: record.data as Record<string, any>
        }))
      });

    } catch (error: any) {
      console.error('Error loading public table:', error);
      setError(error.message || "Failed to load table. It may not exist or may not be publicly accessible.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCellValue = (field: any, value: any) => {
    if (!value) return '-';

    switch (field.field_type) {
      case 'single_select':
        return <Badge variant="secondary">{value}</Badge>;
      case 'multi_select':
        return (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(value) ? value.map((v, i) => (
              <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
            )) : <Badge variant="outline">{value}</Badge>}
          </div>
        );
      case 'number':
      case 'currency':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'checkbox':
        return value ? '✓' : '✗';
      case 'url':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {value}
          </a>
        );
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-primary hover:underline">
            {value}
          </a>
        );
      case 'phone':
        return (
          <a href={`tel:${value}`} className="text-primary hover:underline">
            {value}
          </a>
        );
      case 'attachment':
        if (Array.isArray(value) && value.length > 0) {
          return <Badge>{value.length} file(s)</Badge>;
        }
        return '-';
      case 'rating':
        return value ? '★'.repeat(Number(value)) + '☆'.repeat(5 - Number(value)) : '';
      default:
        return String(value);
    }
  };

  if (isLoading) {
    return (
      <div className={`${isEmbed ? 'h-full' : 'min-h-screen'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading table...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isEmbed ? 'h-full' : 'min-h-screen'} flex items-center justify-center`}>
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tableData) {
    return null;
  }

  const containerClass = isEmbed ? 'h-full bg-background' : 'min-h-screen bg-background';

  return (
    <div className={containerClass}>
      <div className="container mx-auto p-6 space-y-6 h-full">
        {!isEmbed && (
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: tableData.table.color || '#3b82f6' }}
            >
              {tableData.table.icon || '📋'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{tableData.table.name}</h1>
              {tableData.table.description && (
                <p className="text-muted-foreground">{tableData.table.description}</p>
              )}
            </div>
          </div>
        )}

        <Card className={isEmbed ? 'h-full flex flex-col' : ''}>
          <CardContent className={`p-0 ${isEmbed ? 'flex-1 flex flex-col' : ''}`}>
            <div className={`overflow-auto ${isEmbed ? 'flex-1' : 'max-h-[calc(100vh-200px)]'}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableData.fields.map((field) => (
                      <TableHead key={field.id} className="font-semibold">
                        {field.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.records.length === 0 ? (
                    <TableRow>
                      <TableCell 
                        colSpan={tableData.fields.length} 
                        className="text-center py-12 text-muted-foreground"
                      >
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableData.records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/30">
                        {tableData.fields.map((field) => (
                          <TableCell key={field.id} className="border-r">
                            {renderCellValue(field, record.data[field.id])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {!isEmbed && (
          <div className="text-center text-sm text-muted-foreground">
            <p>This is a public view of "{tableData.table.name}"</p>
          </div>
        )}
      </div>
    </div>
  );
};