import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Filter, ArrowUpDown as Sort, Search, MoreHorizontal, Settings, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AttachmentPreviewDialog } from "@/components/AttachmentPreviewDialog";
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
const FIELD_TYPES = [{
  value: 'single_line',
  label: 'Single line text'
}, {
  value: 'long_text',
  label: 'Long text'
}, {
  value: 'single_select',
  label: 'Single select'
}, {
  value: 'multi_select',
  label: 'Multi select'
}, {
  value: 'checkbox',
  label: 'Checkbox'
}, {
  value: 'number',
  label: 'Number'
}, {
  value: 'currency',
  label: 'Currency (GBP)'
}, {
  value: 'percent',
  label: 'Percent'
}, {
  value: 'date',
  label: 'Date'
}, {
  value: 'datetime',
  label: 'Date & Time'
}, {
  value: 'email',
  label: 'Email'
}, {
  value: 'url',
  label: 'URL'
}, {
  value: 'phone',
  label: 'Phone'
}, {
  value: 'rating',
  label: 'Rating'
}, {
  value: 'attachment',
  label: 'Attachment'
}];
export const TableView = () => {
  const {
    tableId
  } = useParams<{
    tableId: string;
  }>();
  const navigate = useNavigate();
  const {
    profile
  } = useAuth();
  const [table, setTable] = useState<BaseTableData | null>(null);
  const [fields, setFields] = useState<BaseField[]>([]);
  const [records, setRecords] = useState<BaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState<{
    recordId: string;
    fieldId: string;
  } | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [editFieldName, setEditFieldName] = useState('');
  const [previewAttachments, setPreviewAttachments] = useState<{
    recordId: string;
    fieldId: string;
    fieldName: string;
    attachments: string[];
  } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldEditRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  useEffect(() => {
    if (tableId && profile?.company_id) {
      loadTableData();
    }
  }, [tableId, profile?.company_id]);
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);
  useEffect(() => {
    if (editingField && fieldEditRef.current) {
      fieldEditRef.current.focus();
      fieldEditRef.current.select();
    }
  }, [editingField]);
  const loadTableData = async () => {
    try {
      // Load table info
      const {
        data: tableData,
        error: tableError
      } = await supabase.from('base_tables').select('*').eq('id', tableId).eq('company_id', profile?.company_id).single();
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
      const {
        data: fieldsData,
        error: fieldsError
      } = await supabase.from('base_fields').select('*').eq('table_id', tableId).order('position');
      if (fieldsError) throw fieldsError;
      setFields(fieldsData || []);

      // Load records
      const {
        data: recordsData,
        error: recordsError
      } = await supabase.from('base_records').select('*').eq('table_id', tableId).is('deleted_at', null).order('created_at', {
        ascending: false
      });
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
        } else if (field.field_type === 'number' || field.field_type === 'currency' || field.field_type === 'percent') {
          defaultData[field.id] = 0;
        } else if (field.field_type === 'rating') {
          defaultData[field.id] = 0;
        } else if (field.field_type === 'attachment') {
          defaultData[field.id] = [];
        } else {
          defaultData[field.id] = '';
        }
      });
      const {
        data,
        error
      } = await supabase.from('base_records').insert({
        table_id: tableId,
        data: defaultData
      }).select().single();
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
  const addField = async () => {
    if (!tableId) return;
    try {
      const newField = {
        table_id: tableId,
        name: `Field ${fields.length + 1}`,
        field_type: 'single_line',
        position: fields.length,
        is_required: false,
        field_config: {}
      };
      const {
        data,
        error
      } = await supabase.from('base_fields').insert(newField).select().single();
      if (error) throw error;
      setFields([...fields, data]);

      // Update all existing records to include the new field
      const updatedRecords = records.map(record => ({
        ...record,
        data: {
          ...record.data,
          [data.id]: ''
        }
      }));
      for (const record of updatedRecords) {
        await supabase.from('base_records').update({
          data: record.data
        }).eq('id', record.id);
      }
      setRecords(updatedRecords);
      toast({
        title: "Success",
        description: "New field added"
      });
    } catch (error) {
      console.error('Error adding field:', error);
      toast({
        title: "Error",
        description: "Failed to add field",
        variant: "destructive"
      });
    }
  };
  const updateCellValue = async (recordId: string, fieldId: string, value: any) => {
    try {
      const record = records.find(r => r.id === recordId);
      if (!record) return;
      const updatedData = {
        ...record.data,
        [fieldId]: value
      };
      const {
        error
      } = await supabase.from('base_records').update({
        data: updatedData
      }).eq('id', recordId);
      if (error) throw error;
      setRecords(records.map(r => r.id === recordId ? {
        ...r,
        data: updatedData
      } : r));
    } catch (error) {
      console.error('Error updating cell:', error);
      toast({
        title: "Error",
        description: "Failed to update cell",
        variant: "destructive"
      });
    }
  };
  const updateFieldName = async (fieldId: string, newName: string) => {
    try {
      const {
        error
      } = await supabase.from('base_fields').update({
        name: newName
      }).eq('id', fieldId);
      if (error) throw error;
      setFields(fields.map(f => f.id === fieldId ? {
        ...f,
        name: newName
      } : f));
      toast({
        title: "Success",
        description: "Field name updated"
      });
    } catch (error) {
      console.error('Error updating field name:', error);
      toast({
        title: "Error",
        description: "Failed to update field name",
        variant: "destructive"
      });
    }
  };
  const updateFieldType = async (fieldId: string, newType: string) => {
    try {
      let fieldConfig = {};

      // Set default config for certain field types
      if (newType === 'single_select' || newType === 'multi_select') {
        fieldConfig = {
          options: [{
            id: '1',
            name: 'Option 1',
            color: '#10b981'
          }, {
            id: '2',
            name: 'Option 2',
            color: '#3b82f6'
          }]
        };
      } else if (newType === 'rating') {
        fieldConfig = {
          max: 5
        };
      }
      const {
        error
      } = await supabase.from('base_fields').update({
        field_type: newType,
        field_config: fieldConfig
      }).eq('id', fieldId);
      if (error) throw error;
      setFields(fields.map(f => f.id === fieldId ? {
        ...f,
        field_type: newType,
        field_config: fieldConfig
      } : f));
      toast({
        title: "Success",
        description: "Field type updated"
      });
    } catch (error) {
      console.error('Error updating field type:', error);
      toast({
        title: "Error",
        description: "Failed to update field type",
        variant: "destructive"
      });
    }
  };
  const handleCellDoubleClick = (recordId: string, fieldId: string, currentValue: any) => {
    const field = fields.find(f => f.id === fieldId);
    
    if (field?.field_type === 'attachment') {
      // Open attachment preview dialog
      setPreviewAttachments({
        recordId,
        fieldId,
        fieldName: field.name,
        attachments: currentValue || []
      });
    } else {
      // Normal edit mode for other field types
      setEditingCell({
        recordId,
        fieldId
      });
      setEditValue(currentValue || '');
    }
  };
  const handleFieldDoubleClick = (fieldId: string, currentName: string) => {
    setEditingField(fieldId);
    setEditFieldName(currentName);
  };
  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      saveCellEdit();
    } else if (e.key === 'Escape') {
      cancelCellEdit();
    }
  };
  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveFieldEdit();
    } else if (e.key === 'Escape') {
      cancelFieldEdit();
    }
  };
  const saveCellEdit = () => {
    if (!editingCell) return;
    updateCellValue(editingCell.recordId, editingCell.fieldId, editValue);
    setEditingCell(null);
    setEditValue('');
  };
  const saveFieldEdit = () => {
    if (!editingField) return;
    updateFieldName(editingField, editFieldName);
    setEditingField(null);
    setEditFieldName('');
  };
  const cancelCellEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };
  const cancelFieldEdit = () => {
    setEditingField(null);
    setEditFieldName('');
  };
  const handleFileUpload = async (files: FileList, recordId: string, fieldId: string) => {
    try {
      const fileUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${profile?.company_id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('base-attachments')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('base-attachments')
          .getPublicUrl(filePath);
        
        fileUrls.push(publicUrl);
      }
      
      const currentValue = records.find(r => r.id === recordId)?.data[fieldId] || [];
      const newValue = [...currentValue, ...fileUrls];
      
      await updateCellValue(recordId, fieldId, newValue);
      setEditingCell(null);
      
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const renderEditableCell = (record: BaseRecord, field: BaseField) => {
    const isEditing = editingCell?.recordId === record.id && editingCell?.fieldId === field.id;
    const value = record.data[field.id];
    
    if (isEditing) {
      if (field.field_type === 'checkbox') {
        return <Checkbox checked={editValue} onCheckedChange={checked => {
          setEditValue(checked);
          updateCellValue(record.id, field.id, checked);
          setEditingCell(null);
        }} />;
      } else if (field.field_type === 'single_select') {
        return <Select value={editValue || ''} onValueChange={newValue => {
          setEditValue(newValue);
          updateCellValue(record.id, field.id, newValue);
          setEditingCell(null);
        }}>
            <SelectTrigger className="w-full h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              {field.field_config?.options?.map((option: any) => <SelectItem key={option.id} value={option.id}>
                  <span className="inline-block w-3 h-3 rounded mr-2" style={{
                backgroundColor: option.color
              }}></span>
                  {option.name}
                </SelectItem>)}
            </SelectContent>
          </Select>;
      } else if (field.field_type === 'attachment') {
        return <div className="w-full h-full relative">
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files, record.id, field.id);
                }
              }}
            />
            <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/30 rounded text-sm text-muted-foreground">
              Drop files or click to upload
            </div>
          </div>;
      } else if (field.field_type === 'long_text') {
        return <Textarea ref={editTextareaRef} value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleCellKeyDown} onBlur={saveCellEdit} className="min-h-[60px] w-full resize-none" />;
      } else {
        return <Input ref={editInputRef} value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleCellKeyDown} onBlur={saveCellEdit} type={field.field_type === 'number' || field.field_type === 'currency' || field.field_type === 'percent' ? 'number' : 'text'} className="w-full h-8 border-0 bg-transparent p-1" />;
      }
    }

    // Handle drag and drop for attachment fields
    if (field.field_type === 'attachment') {
      return <div 
        className="w-full h-full p-2 cursor-pointer hover:bg-muted/30 rounded relative"
        onDoubleClick={() => handleCellDoubleClick(record.id, field.id, value)}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('bg-primary/10', 'border-primary');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('bg-primary/10', 'border-primary');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('bg-primary/10', 'border-primary');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files, record.id, field.id);
          }
        }}
      >
        {renderCellValue(field, value)}
      </div>;
    }
    
    return <div className="w-full h-full p-2 cursor-pointer hover:bg-muted/30 rounded" onDoubleClick={() => handleCellDoubleClick(record.id, field.id, value)}>
        {renderCellValue(field, value)}
      </div>;
  };
  const renderCellValue = (field: BaseField, value: any) => {
    switch (field.field_type) {
      case 'single_line':
      case 'long_text':
        return value || '';
      case 'checkbox':
        return value ? '✓' : '';
      case 'number':
        return value ? Number(value).toString() : '';
      case 'currency':
        return value ? `£${Number(value).toFixed(2)}` : '';
      case 'percent':
        return value ? `${Number(value)}%` : '';
      case 'rating':
        return value ? '★'.repeat(Number(value)) + '☆'.repeat(5 - Number(value)) : '';
      case 'attachment':
        if (value && Array.isArray(value) && value.length > 0) {
          return <div className="flex gap-1 flex-wrap">
            {value.slice(0, 3).map((url: string, index: number) => {
              const fileName = url.split('/').pop() || 'file';
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
              
              return <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs max-w-[80px]">
                {isImage ? (
                  <img src={url} alt="attachment" className="w-4 h-4 object-cover rounded" />
                ) : (
                  <div className="w-4 h-4 bg-primary/20 rounded flex items-center justify-center text-[8px]">📎</div>
                )}
                <span className="truncate">{fileName.length > 8 ? fileName.substring(0, 8) + '...' : fileName}</span>
              </div>;
            })}
            {value.length > 3 && <span className="text-xs text-muted-foreground">+{value.length - 3}</span>}
          </div>;
        }
        return <span className="text-muted-foreground text-xs">No files</span>;
      case 'single_select':
        if (value && field.field_config?.options) {
          const option = field.field_config.options.find((opt: any) => opt.id === value);
          return option ? <span className="px-2 py-1 rounded text-xs text-white" style={{
            backgroundColor: option.color
          }}>
              {option.name}
            </span> : '';
        }
        return '';
      default:
        return value ? String(value) : '';
    }
  };
  const renderEditableFieldHeader = (field: BaseField) => {
    const isEditing = editingField === field.id;
    return <div className="flex items-center justify-between group">
        {isEditing ? <Input ref={fieldEditRef} value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onKeyDown={handleFieldKeyDown} onBlur={saveFieldEdit} className="h-8 border-0 bg-transparent p-0 font-medium" /> : <span className="cursor-pointer font-medium" onDoubleClick={() => handleFieldDoubleClick(field.id, field.name)}>
            {field.name}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </span>}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
            <DropdownMenuItem onClick={() => handleFieldDoubleClick(field.id, field.name)}>
              <Type className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {FIELD_TYPES.map(type => <DropdownMenuItem key={type.value} onClick={() => updateFieldType(field.id, type.value)} className={field.field_type === type.value ? 'bg-muted' : ''}>
                {type.label}
              </DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>;
  };
  if (loading) {
    return <div className="min-h-screen bg-background p-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
      </div>

      {/* Attachment Preview Dialog */}
      {previewAttachments && (
        <AttachmentPreviewDialog
          isOpen={!!previewAttachments}
          onClose={() => setPreviewAttachments(null)}
          attachments={previewAttachments.attachments}
          fieldName={previewAttachments.fieldName}
          onUpdate={(newAttachments) => {
            updateCellValue(previewAttachments.recordId, previewAttachments.fieldId, newAttachments);
            setPreviewAttachments({
              ...previewAttachments,
              attachments: newAttachments
            });
          }}
        />
      )}
    </div>;
  }
  if (!table) {
    return <div className="min-h-screen bg-background p-6 pt-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-semibold mb-4">Table not found</h1>
          <Button onClick={() => navigate('/base')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Base
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 pt-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/base')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                
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
              <Button onClick={addField} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Field
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
            <Input placeholder="Search records..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Grid Table */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {fields.map(field => <TableHead key={field.id} className="font-medium border-r min-w-[150px] p-0">
                      <div className="p-3">
                        {renderEditableFieldHeader(field)}
                      </div>
                    </TableHead>)}
                  <TableHead className="w-12 p-3">
                    <Button onClick={addField} variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? <TableRow>
                    <TableCell colSpan={fields.length + 1} className="text-center py-12 text-muted-foreground">
                      No records yet. Click "Add Record" to get started.
                    </TableCell>
                  </TableRow> : records.map(record => <TableRow key={record.id} className="hover:bg-muted/30">
                      {fields.map(field => <TableCell key={field.id} className="border-r p-0 h-12">
                          {renderEditableCell(record, field)}
                        </TableCell>)}
                      <TableCell className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>)}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>;
};