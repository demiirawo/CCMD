import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { ArrowLeft, Plus, Filter, ArrowUpDown as Sort, Search, MoreHorizontal, Settings, Type, Hash, FileText, List, ListChecks, CheckSquare, PoundSterling, Percent, Calendar, Clock, Mail, Link, Phone, Star, Paperclip, Calculator, CalendarIcon, Group, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";
import { AttachmentPreviewDialog } from "@/components/AttachmentPreviewDialog";
import { FormulaEditor } from "@/components/FormulaEditor";
import { FormulaCell } from "@/components/FormulaCell";
import { FieldConfigDialog } from "@/components/FieldConfigDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { TableHistoryDialog } from "@/components/TableHistoryDialog";
import { TableFilterDialog } from "@/components/TableFilterDialog";
import { ViewsSidebar } from "@/components/ViewsSidebar";
import { GroupByDialog } from "@/components/GroupByDialog";
import { TableSortDialog, type SortCondition } from "@/components/TableSortDialog";
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
}, {
  value: 'formula',
  label: 'Formula'
}];
const getFieldTypeIcon = (fieldType: string) => {
  switch (fieldType) {
    case 'single_line':
      return Type;
    case 'long_text':
      return FileText;
    case 'single_select':
      return List;
    case 'multi_select':
      return ListChecks;
    case 'checkbox':
      return CheckSquare;
    case 'number':
      return Hash;
    case 'currency':
      return PoundSterling;
    case 'percent':
      return Percent;
    case 'date':
      return Calendar;
    case 'datetime':
      return Clock;
    case 'email':
      return Mail;
    case 'url':
      return Link;
    case 'phone':
      return Phone;
    case 'rating':
      return Star;
    case 'attachment':
      return Paperclip;
    case 'formula':
      return Calculator;
    default:
      return Type;
  }
};
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
  const [formulaEditor, setFormulaEditor] = useState<{
    fieldId: string;
    initialFormula: string;
  } | null>(null);
  const [formulaTypeChangeDialog, setFormulaTypeChangeDialog] = useState<{
    isOpen: boolean;
    fieldId: string | null;
    pendingType: string;
  }>({
    isOpen: false,
    fieldId: null,
    pendingType: ''
  });
  const [fieldConfigDialog, setFieldConfigDialog] = useState<{
    isOpen: boolean;
    field: BaseField | null;
  }>({
    isOpen: false,
    field: null
  });
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    fieldId: string | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    fieldId: null
  });
  const [filterDialog, setFilterDialog] = useState(false);
  const [filters, setFilters] = useState<{
    conditions: Array<{
      id: string;
      field: string;
      operator: string;
      value: any;
    }>;
    groups: Array<{
      id: string;
      operator: 'AND' | 'OR';
      conditions: Array<{
        id: string;
        field: string;
        operator: string;
        value: any;
      }>;
    }>;
  }>({ conditions: [], groups: [] });
  
  // View state
  const [currentView, setCurrentView] = useState<BaseView | null>(null);
  
  // Group by state
  const [groupByField, setGroupByField] = useState<string | null>(null);
  const [groupByDialog, setGroupByDialog] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Sorting state
  const [sorts, setSorts] = useState<SortCondition[]>([]);
  const [sortDialog, setSortDialog] = useState(false);
  const [automaticSort, setAutomaticSort] = useState(false);
  
  // Multi-select state
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectionStart, setSelectionStart] = useState<{recordId: string, fieldId: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [multiSelectContextMenu, setMultiSelectContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
  });
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldEditRef = useRef<HTMLInputElement>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (tableId && profile?.company_id) {
      loadTableData();
    }
  }, [tableId, profile?.company_id]);
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({
        isOpen: false,
        x: 0,
        y: 0,
        fieldId: null
      });
    };
    if (contextMenu.isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.isOpen]);
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
  const addRecord = async (initialData?: Record<string, any>) => {
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
        } else if (field.field_type === 'date' || field.field_type === 'datetime') {
          defaultData[field.id] = null;
        } else {
          defaultData[field.id] = '';
        }
      });

      // Merge with any initial data provided (for group records)
      const finalData = { ...defaultData, ...initialData };

      const {
        data,
        error
      } = await supabase.from('base_records').insert({
        table_id: tableId,
        data: finalData
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
  
  const duplicateRecord = async (recordId: string) => {
    if (!tableId || !profile?.company_id) return;
    try {
      const originalRecord = records.find(r => r.id === recordId);
      if (!originalRecord) return;

      const { data, error } = await supabase
        .from('base_records')
        .insert({
          table_id: tableId,
          data: originalRecord.data
        })
        .select()
        .single();

      if (error) throw error;

      setRecords([data, ...records]);
      toast({
        title: "Success",
        description: "Record duplicated"
      });
    } catch (error) {
      console.error('Error duplicating record:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate record",
        variant: "destructive"
      });
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('base_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      setRecords(records.filter(r => r.id !== recordId));
      toast({
        title: "Success",
        description: "Record deleted"
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
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
      const updatedRecords = records.map(record => {
        let defaultValue: any = '';
        if (data.field_type === 'checkbox') {
          defaultValue = false;
        } else if (data.field_type === 'number' || data.field_type === 'currency' || data.field_type === 'percent') {
          defaultValue = 0;
        } else if (data.field_type === 'rating') {
          defaultValue = 0;
        } else if (data.field_type === 'attachment') {
          defaultValue = [];
        } else if (data.field_type === 'date' || data.field_type === 'datetime') {
          defaultValue = null;
        }
        return {
          ...record,
          data: {
            ...record.data,
            [data.id]: defaultValue
          }
        };
      });
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
    // If changing to formula type, show confirmation dialog
    if (newType === 'formula') {
      setFormulaTypeChangeDialog({
        isOpen: true,
        fieldId,
        pendingType: newType
      });
      return;
    }
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
      } else if (newType === 'formula') {
        fieldConfig = {
          formula: ''
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
  const deleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field? This action cannot be undone and will remove all data in this field.')) {
      return;
    }
    try {
      // Delete the field from database
      const {
        error
      } = await supabase.from('base_fields').delete().eq('id', fieldId);
      if (error) throw error;

      // Update all records to remove data for this field
      const updatedRecords = records.map(record => {
        const newData = {
          ...record.data
        };
        delete newData[fieldId];
        return {
          ...record,
          data: newData
        };
      });

      // Update records in database
      for (const record of updatedRecords) {
        await supabase.from('base_records').update({
          data: record.data
        }).eq('id', record.id);
      }

      // Update local state
      setFields(fields.filter(f => f.id !== fieldId));
      setRecords(updatedRecords);
      toast({
        title: "Success",
        description: "Field deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: "Error",
        description: "Failed to delete field",
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
    } else if (field?.field_type === 'formula') {
      // Open formula editor for formula fields
      setFormulaEditor({
        fieldId,
        initialFormula: field.field_config?.formula || ''
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
  const handleFieldRightClick = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      fieldId
    });
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
        const {
          error: uploadError
        } = await supabase.storage.from('base-attachments').upload(filePath, file);
        if (uploadError) throw uploadError;
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('base-attachments').getPublicUrl(filePath);
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
  
  // View handling functions
  const handleViewChange = (view: BaseView | null) => {
    setCurrentView(view);
    if (view) {
      // Apply view's filters
      const viewFilters = {
        conditions: Array.isArray(view.filters) ? view.filters : [],
        groups: Array.isArray(view.groups) ? view.groups : []
      };
      setFilters(viewFilters);
      
      // Apply view's sorting
      const viewSorts = Array.isArray(view.sorts) ? view.sorts : [];
      setSorts(viewSorts);
      
      // Apply view's grouping
      const viewSettings = view.settings || {};
      const viewGroupBy = viewSettings.groupBy || null;
      setGroupByField(viewGroupBy);
      
      // Apply automatic sort setting
      setAutomaticSort(viewSettings.automaticSort || false);
      
      console.log('Switched to view:', view.name, 'with filters:', viewFilters, 'sorts:', viewSorts, 'groupBy:', viewGroupBy);
    } else {
      // Clear all view-specific settings when switching to "All Records"
      setFilters({ conditions: [], groups: [] });
      setSorts([]);
      setGroupByField(null);
      setAutomaticSort(false);
      console.log('Switched to All Records - cleared all view settings');
    }
  };

  const handleCreateView = () => {
    // This will be handled by the ViewsSidebar component
    console.log('Create view clicked');
  };

  // Get current table state to pass to new views
  const getCurrentTableState = () => ({
    filters: filters.conditions,
    groups: filters.groups,
    sorts: sorts,
    settings: {
      groupBy: groupByField,
      automaticSort: automaticSort
    }
  });

  // Helper function to update view settings
  const updateViewSettings = async (viewId: string, newSettings: any) => {
    try {
      const currentViewData = currentView;
      if (!currentViewData) return;

      const updatedSettings = { ...currentViewData.settings, ...newSettings };
      
      const { error } = await supabase
        .from('base_views')
        .update({ settings: updatedSettings })
        .eq('id', viewId);

      if (error) throw error;

      // Update current view state
      setCurrentView({
        ...currentViewData,
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Error updating view settings:', error);
      toast({
        title: "Error",
        description: "Failed to update view settings",
        variant: "destructive"
      });
    }
  };

  // Helper function to update view filters, sorts, etc.
  const updateViewData = async (viewId: string, updates: Partial<BaseView>) => {
    try {
      const { error } = await supabase
        .from('base_views')
        .update(updates)
        .eq('id', viewId);

      if (error) throw error;

      // Update current view state
      if (currentView && currentView.id === viewId) {
        setCurrentView({
          ...currentView,
          ...updates
        });
      }
    } catch (error) {
      console.error('Error updating view data:', error);
      toast({
        title: "Error",
        description: "Failed to update view",
        variant: "destructive"
      });
    }
  };

  // Group handling functions
  const handleGroupByApply = (fieldId: string | null) => {
    console.log('handleGroupByApply called with:', fieldId);
    setGroupByField(fieldId);
    
    // Update current view if one is selected
    if (currentView) {
      updateViewSettings(currentView.id, { groupBy: fieldId });
    }
    
    if (fieldId) {
      // Auto-expand all groups when grouping is applied
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        const uniqueValues = new Set(records.map(record => {
          const value = record.data[fieldId];
          return formatGroupValue(value, field);
        }));
        console.log('Unique group values:', Array.from(uniqueValues));
        setExpandedGroups(new Set(Array.from(uniqueValues)));
      }
    } else {
      console.log('Clearing grouping');
      setExpandedGroups(new Set());
    }
  };

  const toggleGroupExpansion = (groupValue: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupValue)) {
      newExpanded.delete(groupValue);
    } else {
      newExpanded.add(groupValue);
    }
    setExpandedGroups(newExpanded);
  };

  const formatGroupValue = (value: any, field: BaseField): string => {
    if (value === null || value === undefined || value === '') {
      return '(Empty)';
    }
    
    if (field.field_type === 'date' || field.field_type === 'datetime') {
      try {
        return format(new Date(value), field.field_type === 'date' ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm');
      } catch {
        return String(value);
      }
    }
    
    if (field.field_type === 'single_select' && field.field_config?.options) {
      const option = field.field_config.options.find((opt: any) => opt.id === value);
      return option ? option.name : String(value);
    }
    
    return String(value);
  };

  // Multi-selection handlers
  const getCellId = (recordId: string, fieldId: string) => `${recordId}-${fieldId}`;
  
  const handleCellMouseDown = (recordId: string, fieldId: string, e: React.MouseEvent) => {
    // Don't start selection if we're editing or right-clicking
    if (editingCell || e.button !== 0) return;
    
    e.preventDefault();
    setSelectionStart({ recordId, fieldId });
    setIsDragging(true);
    
    // Clear existing selection unless Ctrl/Cmd is held
    if (!e.ctrlKey && !e.metaKey) {
      setSelectedCells(new Set([getCellId(recordId, fieldId)]));
    } else {
      // Add/remove from selection
      const cellId = getCellId(recordId, fieldId);
      const newSelection = new Set(selectedCells);
      if (newSelection.has(cellId)) {
        newSelection.delete(cellId);
      } else {
        newSelection.add(cellId);
      }
      setSelectedCells(newSelection);
    }
  };

  const handleCellMouseEnter = (recordId: string, fieldId: string) => {
    if (!isDragging || !selectionStart) return;
    
    // Calculate selection range
    const startRecordIndex = sortedRecords.findIndex(r => r.id === selectionStart.recordId);
    const endRecordIndex = sortedRecords.findIndex(r => r.id === recordId);
    const startFieldIndex = fields.findIndex(f => f.id === selectionStart.fieldId);
    const endFieldIndex = fields.findIndex(f => f.id === fieldId);
    
    const minRecordIndex = Math.min(startRecordIndex, endRecordIndex);
    const maxRecordIndex = Math.max(startRecordIndex, endRecordIndex);
    const minFieldIndex = Math.min(startFieldIndex, endFieldIndex);
    const maxFieldIndex = Math.max(startFieldIndex, endFieldIndex);
    
    const newSelection = new Set<string>();
    for (let r = minRecordIndex; r <= maxRecordIndex; r++) {
      for (let f = minFieldIndex; f <= maxFieldIndex; f++) {
        if (sortedRecords[r] && fields[f]) {
          newSelection.add(getCellId(sortedRecords[r].id, fields[f].id));
        }
      }
    }
    
    setSelectedCells(newSelection);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectionStart(null);
  };

  const handleCellRightClick = (e: React.MouseEvent, recordId: string, fieldId: string) => {
    e.preventDefault();
    const cellId = getCellId(recordId, fieldId);
    
    // If right-clicking on an unselected cell, select only that cell
    if (!selectedCells.has(cellId)) {
      setSelectedCells(new Set([cellId]));
    }
    
    setMultiSelectContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Multi-selection actions
  const deleteSelectedCells = async () => {
    try {
      const updates = new Map<string, any>();
      
      selectedCells.forEach(cellId => {
        const [recordId, fieldId] = cellId.split('-');
        if (!updates.has(recordId)) {
          const record = records.find(r => r.id === recordId);
          if (record) {
            updates.set(recordId, { ...record.data });
          }
        }
        
        const recordData = updates.get(recordId);
        if (recordData) {
          recordData[fieldId] = null;
        }
      });
      
      // Update all affected records in database
      const updatePromises = Array.from(updates.entries()).map(async ([recordId, data]) => {
        const { error } = await supabase
          .from('base_records')
          .update({ data })
          .eq('id', recordId);
        
        if (error) throw error;
        return { recordId, data };
      });
      
      const results = await Promise.all(updatePromises);
      
      // Update local state once after all database updates are complete
      setRecords(prevRecords => 
        prevRecords.map(record => {
          const update = results.find(result => result.recordId === record.id);
          return update ? { ...record, data: update.data } : record;
        })
      );
      
      setSelectedCells(new Set());
      setMultiSelectContextMenu({ isOpen: false, x: 0, y: 0 });
      
      toast({
        title: "Success",
        description: `Cleared ${selectedCells.size} cells`
      });
    } catch (error) {
      console.error('Error clearing cells:', error);
      toast({
        title: "Error",
        description: "Failed to clear cells",
        variant: "destructive"
      });
    }
  };

  const deleteSelectedRows = async () => {
    try {
      const recordIds = new Set<string>();
      selectedCells.forEach(cellId => {
        const [recordId] = cellId.split('-');
        recordIds.add(recordId);
      });
      
      for (const recordId of recordIds) {
        await deleteRecord(recordId);
      }
      
      setSelectedCells(new Set());
      setMultiSelectContextMenu({ isOpen: false, x: 0, y: 0 });
      
      toast({
        title: "Success",
        description: `Deleted ${recordIds.size} rows`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rows",
        variant: "destructive"
      });
    }
  };

  const addRowAbove = () => {
    addRecord();
    setSelectedCells(new Set());
    setMultiSelectContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const addRowBelow = () => {
    addRecord();
    setSelectedCells(new Set());
    setMultiSelectContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  // Mouse up event listener
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setMultiSelectContextMenu({ isOpen: false, x: 0, y: 0 });
    };
    
    if (multiSelectContextMenu.isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [multiSelectContextMenu.isOpen]);

  const groupRecordsByField = (records: BaseRecord[], fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return {};

    const grouped: Record<string, BaseRecord[]> = {};
    
    records.forEach(record => {
      const value = record.data[fieldId];
      const groupValue = formatGroupValue(value, field);
      
      if (!grouped[groupValue]) {
        grouped[groupValue] = [];
      }
      grouped[groupValue].push(record);
    });

    // Sort groups: (Empty) first, then alphabetically
    const sortedGroups: Record<string, BaseRecord[]> = {};
    const groupKeys = Object.keys(grouped).sort((a, b) => {
      if (a === '(Empty)') return -1;
      if (b === '(Empty)') return 1;
      return a.localeCompare(b);
    });

    groupKeys.forEach(key => {
      sortedGroups[key] = grouped[key];
    });

    return sortedGroups;
  };
  
  // Apply filters to records
  const applyFilters = (records: BaseRecord[]) => {
    if (filters.conditions.length === 0 && filters.groups.length === 0) {
      return records;
    }

    const filtered = records.filter(record => {
      // Check individual conditions (all must be true - AND logic)
      const conditionsMatch = filters.conditions.length === 0 || filters.conditions.every(condition => {
        const field = fields.find(f => f.id === condition.field);
        if (!field) return false;
        
        const value = record.data[condition.field];
        return evaluateCondition(value, condition.operator, condition.value, field);
      });

      // Check groups (all must be true - AND logic between groups)
      const groupsMatch = filters.groups.length === 0 || filters.groups.every(group => {
        // Within a group, use the group's operator (AND/OR)
        if (group.operator === 'AND') {
          return group.conditions.every(condition => {
            const field = fields.find(f => f.id === condition.field);
            if (!field) return false;
            
            const value = record.data[condition.field];
            return evaluateCondition(value, condition.operator, condition.value, field);
          });
        } else {
          return group.conditions.some(condition => {
            const field = fields.find(f => f.id === condition.field);
            if (!field) return false;
            
            const value = record.data[condition.field];
            return evaluateCondition(value, condition.operator, condition.value, field);
          });
        }
      });

      return conditionsMatch && groupsMatch;
    });
    
    return filtered;
  };

  const evaluateCondition = (fieldValue: any, operator: string, filterValue: any, field: BaseField) => {
    switch (operator) {
      case 'equals':
        return fieldValue == filterValue;
      case 'not_equals':
        return fieldValue != filterValue;
      case 'contains':
        return String(fieldValue || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
      case 'not_contains':
        return !String(fieldValue || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
      case 'starts_with':
        return String(fieldValue || '').toLowerCase().startsWith(String(filterValue || '').toLowerCase());
      case 'ends_with':
        return String(fieldValue || '').toLowerCase().endsWith(String(filterValue || '').toLowerCase());
      case 'is_empty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
      case 'is_not_empty':
        return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);
      case 'greater_than':
        return Number(fieldValue) > Number(filterValue);
      case 'less_than':
        return Number(fieldValue) < Number(filterValue);
      case 'greater_equal':
        return Number(fieldValue) >= Number(filterValue);
      case 'less_equal':
        return Number(fieldValue) <= Number(filterValue);
      case 'before':
        if (field.field_type === 'date') {
          // Handle null, undefined, or empty string field values
          if (!fieldValue || fieldValue === '') {
            return false; // Exclude empty dates from "before" filters
          }
          try {
            const fieldDate = new Date(fieldValue);
            const filterDate = new Date(filterValue);
            if (isNaN(fieldDate.getTime()) || isNaN(filterDate.getTime())) return false;
            return fieldDate < filterDate;
          } catch (e) {
            console.error('Date comparison error:', e);
            return false;
          }
        }
        return new Date(fieldValue) < new Date(filterValue);
      case 'after':
        if (field.field_type === 'date') {
          if (!fieldValue || fieldValue === '') return false;
          try {
            const fieldDate = new Date(fieldValue);
            const filterDate = new Date(filterValue);
            if (isNaN(fieldDate.getTime()) || isNaN(filterDate.getTime())) return false;
            return fieldDate > filterDate;
          } catch (e) {
            console.error('Date comparison error:', e);
            return false;
          }
        }
        return new Date(fieldValue) > new Date(filterValue);
      case 'is_checked':
        return fieldValue === true;
      case 'is_unchecked':
        return fieldValue === false;
      default:
        return true;
    }
  };
  // Apply search and filters
  const filteredRecords = applyFilters(records).filter(record => {
    if (!searchQuery) return true;
    
    // Search across all field values
    return fields.some(field => {
      const value = record.data[field.id];
      if (value === null || value === undefined) return false;
      
      return String(value).toLowerCase().includes(searchQuery.toLowerCase());
    });
  });

  // Apply sorting function
  const applySorting = (recordsToSort: BaseRecord[]) => {
    if (sorts.length === 0) return recordsToSort;
    
    return [...recordsToSort].sort((a, b) => {
      for (const sort of sorts) {
        const field = fields.find(f => f.id === sort.fieldId);
        if (!field) continue;
        
        const aValue = a.data[sort.fieldId];
        const bValue = b.data[sort.fieldId];
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) continue;
        if (aValue == null) return sort.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sort.direction === 'asc' ? 1 : -1;
        
        let comparison = 0;
        
        // Sort based on field type
        switch (field.field_type) {
          case 'number':
          case 'currency':
          case 'percent':
            comparison = Number(aValue || 0) - Number(bValue || 0);
            break;
          case 'date':
          case 'datetime':
            const aDate = new Date(aValue);
            const bDate = new Date(bValue);
            comparison = aDate.getTime() - bDate.getTime();
            break;
          case 'checkbox':
            comparison = (bValue ? 1 : 0) - (aValue ? 1 : 0);
            break;
          default:
            // String comparison for text fields
            comparison = String(aValue || '').localeCompare(String(bValue || ''));
        }
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  };

  // Apply sorting to filtered records
  const sortedRecords = applySorting(filteredRecords);

  // Group records if grouping is active, and sort within groups
  const groupedRecords = groupByField 
    ? (() => {
        const grouped = groupRecordsByField(sortedRecords, groupByField);
        // Apply sorting within each group
        const sortedGrouped: Record<string, BaseRecord[]> = {};
        Object.entries(grouped).forEach(([groupValue, groupRecords]) => {
          sortedGrouped[groupValue] = applySorting(groupRecords);
        });
        return sortedGrouped;
      })()
    : null;

  // Debug logging (only when a view is selected)
  if (currentView) {
    console.log('Current view:', currentView.name);
    console.log('View filters:', currentView.filters);
    console.log('Applied filters:', filters);
    console.log('Records before filtering:', records.length);
    console.log('Records after filtering:', sortedRecords.length);
  }
  console.log('Current filters:', filters);
  console.log('Records before filtering:', records.length);
  console.log('Records after filtering:', sortedRecords.length);

  const renderEditableCell = (record: BaseRecord, field: BaseField) => {
    const isEditing = editingCell?.recordId === record.id && editingCell?.fieldId === field.id;
    const cellId = getCellId(record.id, field.id);
    const isSelected = selectedCells.has(cellId);
    const value = record.data[field.id];
    
    if (isEditing) {
      if (field.field_type === 'checkbox') {
        return <div className={cn("w-full h-full flex items-center justify-center", isSelected && "bg-primary/20")}>
          <Checkbox checked={editValue} onCheckedChange={checked => {
            setEditValue(checked);
            updateCellValue(record.id, field.id, checked);
            setEditingCell(null);
          }} />
        </div>;
      } else if (field.field_type === 'date' || field.field_type === 'datetime') {
        let dateValue: Date | undefined = undefined;
        if (editValue) {
          const parsedDate = new Date(editValue);
          if (isValid(parsedDate)) {
            dateValue = parsedDate;
          }
        }
        return <div className={cn("w-full h-full", isSelected && "bg-primary/20")}>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full h-8 justify-start text-left font-normal border-0 bg-transparent p-1", !dateValue && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "dd/MM/yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dateValue} onSelect={date => {
              if (date) {
                const isoString = field.field_type === 'datetime' ? date.toISOString() : date.toISOString().split('T')[0];
                setEditValue(isoString);
                updateCellValue(record.id, field.id, isoString);
                setEditingCell(null);
              }
            }} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>;
      } else if (field.field_type === 'single_select') {
        return <div className={cn("w-full h-full", isSelected && "bg-primary/20")}>
          <Select value={editValue || ''} onValueChange={newValue => {
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
          </Select>
        </div>;
      } else if (field.field_type === 'attachment') {
        return <div className={cn("w-full h-full relative", isSelected && "bg-primary/20")}>
            <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files, record.id, field.id);
            }
          }} />
            <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/30 rounded text-sm text-muted-foreground">
              Drop files or click to upload
            </div>
          </div>;
      } else if (field.field_type === 'long_text') {
        return <div className={cn("w-full h-full", isSelected && "bg-primary/20")}>
          <Textarea ref={editTextareaRef} value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleCellKeyDown} onBlur={saveCellEdit} className="min-h-[60px] w-full resize-none" />
        </div>;
      } else {
        return <div className={cn("w-full h-full", isSelected && "bg-primary/20")}>
          <Input ref={editInputRef} value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleCellKeyDown} onBlur={saveCellEdit} type={field.field_type === 'number' || field.field_type === 'currency' || field.field_type === 'percent' ? 'number' : 'text'} className="w-full h-8 border-0 bg-transparent p-1" />
        </div>;
      }
    }

    // Handle drag and drop for attachment fields
    if (field.field_type === 'attachment') {
      return (
        <div 
          className={cn(
            "w-full h-full p-2 cursor-pointer hover:bg-muted/30 rounded relative user-select-none",
            isSelected && "bg-primary/20 ring-2 ring-primary/40"
          )}
          onDoubleClick={() => handleCellDoubleClick(record.id, field.id, value)}
          onMouseDown={(e) => handleCellMouseDown(record.id, field.id, e)}
          onMouseEnter={() => handleCellMouseEnter(record.id, field.id)}
          onContextMenu={(e) => handleCellRightClick(e, record.id, field.id)}
          onDragOver={e => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-primary/10', 'border-primary');
          }} 
          onDragLeave={e => {
            e.currentTarget.classList.remove('bg-primary/10', 'border-primary');
          }} 
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-primary/10', 'border-primary');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileUpload(e.dataTransfer.files, record.id, field.id);
            }
          }}
        >
          {renderCellValue(field, value, record)}
        </div>
      );
    }
    
    return (
      <div 
        className={cn(
          "w-full h-full p-2 cursor-pointer hover:bg-muted/30 rounded user-select-none",
          isSelected && "bg-primary/20 ring-2 ring-primary/40"
        )}
        onDoubleClick={() => handleCellDoubleClick(record.id, field.id, value)}
        onMouseDown={(e) => handleCellMouseDown(record.id, field.id, e)}
        onMouseEnter={() => handleCellMouseEnter(record.id, field.id)}
        onContextMenu={(e) => handleCellRightClick(e, record.id, field.id)}
      >
        {renderCellValue(field, value, record)}
      </div>
    );
  };
  
  const renderCellValue = (field: BaseField, value: any, record?: BaseRecord) => {
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
      case 'date':
        if (value) {
          try {
            const date = new Date(value);
            return isValid(date) ? format(date, 'dd/MM/yyyy') : value;
          } catch {
            return value;
          }
        }
        return '';
      case 'datetime':
        if (value) {
          try {
            const date = new Date(value);
            return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm') : value;
          } catch {
            return value;
          }
        }
        return '';
      case 'rating':
        if (!value) return '';
        const rating = Math.max(0, Math.min(5, Number(value)));
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
      case 'attachment':
        if (value && Array.isArray(value) && value.length > 0) {
          return <div className="flex gap-1 flex-wrap">
            {value.slice(0, 3).map((url: string, index: number) => {
              const fileName = url.split('/').pop() || 'file';
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
              return <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs max-w-[80px]">
                {isImage ? <img src={url} alt="attachment" className="w-4 h-4 object-cover rounded" /> : <div className="w-4 h-4 bg-primary/20 rounded flex items-center justify-center text-[8px]">📎</div>}
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
      case 'formula':
        if (!record) return '';
        const fieldNames = fields.reduce((acc, f) => {
          acc[f.id] = f.name;
          return acc;
        }, {} as Record<string, string>);
        return <FormulaCell formula={field.field_config?.formula || ''} recordData={record.data} allRecords={records.map(r => r.data)} fieldNames={fieldNames} format={field.field_config?.format} isEditing={editingCell?.recordId === record.id && editingCell?.fieldId === field.id} onEdit={() => {
          setFormulaEditor({
            fieldId: field.id,
            initialFormula: field.field_config?.formula || ''
          });
        }} />;
      default:
        return value ? String(value) : '';
    }
  };
  const renderEditableFieldHeader = (field: BaseField) => {
    const isEditing = editingField === field.id;
    const IconComponent = getFieldTypeIcon(field.field_type);
    return <div className="flex items-center justify-between group" onContextMenu={e => handleFieldRightClick(e, field.id)}>
        <div className="flex items-center gap-2 flex-1">
          <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {isEditing ? <Input ref={fieldEditRef} value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onKeyDown={handleFieldKeyDown} onBlur={saveFieldEdit} className="h-8 border-0 bg-transparent p-0 font-medium flex-1" /> : <span className="cursor-pointer font-medium truncate" onDoubleClick={() => handleFieldDoubleClick(field.id, field.name)}>
              {field.name}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </span>}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border shadow-md z-50 min-w-48">
            <DropdownMenuItem onClick={() => handleFieldDoubleClick(field.id, field.name)}>
              <Type className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            {field.field_type === 'formula' && <DropdownMenuItem onClick={() => setFormulaEditor({
            fieldId: field.id,
            initialFormula: field.field_config?.formula || ''
          })}>
                Edit Formula
              </DropdownMenuItem>}
            <DropdownMenuSeparator />
            {FIELD_TYPES.map(type => {
            const TypeIcon = getFieldTypeIcon(type.value);
            return <DropdownMenuItem key={type.value} onClick={() => updateFieldType(field.id, type.value)} className={field.field_type === type.value ? 'bg-muted' : ''}>
                  <TypeIcon className="h-4 w-4 mr-2" />
                  {type.label}
                </DropdownMenuItem>;
          })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => deleteField(field.id)} className="text-destructive">
              Delete Field
            </DropdownMenuItem>
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
  return (
    <div className="min-h-screen bg-background flex">
      {/* Views Sidebar */}
      <ViewsSidebar
        tableId={tableId || ''}
        currentView={currentView}
        onViewChange={handleViewChange}
        onCreateView={handleCreateView}
        currentTableState={getCurrentTableState()}
        onViewUpdated={(updatedView) => {
          // Update current view if it's the one that was updated
          if (currentView && currentView.id === updatedView.id) {
            setCurrentView(updatedView);
          }
        }}
      />
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="max-w-full mx-auto px-6 py-4 pt-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/base')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-foreground">{table.name}</h1>
                    {currentView && (
                      <span className="text-sm text-muted-foreground">
                        • {currentView.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sortedRecords.length} 
                    {(filters.conditions.length > 0 || filters.groups.length > 0 || sorts.length > 0 || groupByField) && ' filtered'} records
                    {(filters.conditions.length > 0 || filters.groups.length > 0 || sorts.length > 0 || groupByField) && records.length !== sortedRecords.length && (
                      <span className="text-muted-foreground/70"> of {records.length} total</span>
                    )}
                  </p>
                  
                  {/* Active Filters Display */}
                  {(filters.conditions.length > 0 || filters.groups.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filters.conditions.map((condition, index) => {
                        const field = fields.find(f => f.id === condition.field);
                        if (!field) return null;
                        
                        const operatorText = {
                          'equals': '=',
                          'not_equals': '≠',
                          'contains': 'contains',
                          'not_contains': 'does not contain',
                          'starts_with': 'starts with',
                          'ends_with': 'ends with',
                          'greater_than': '>',
                          'less_than': '<',
                          'greater_than_or_equal': '≥',
                          'less_than_or_equal': '≤',
                          'is_empty': 'is empty',
                          'is_not_empty': 'is not empty'
                        }[condition.operator] || condition.operator;
                        
                        return (
                          <div key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                            <span className="font-medium">{field.name}</span>
                            <span className="text-primary/70">{operatorText}</span>
                            {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                              <span className="font-medium">"{condition.value}"</span>
                            )}
                          </div>
                        );
                      })}
                      
                      {filters.groups.map((group, groupIndex) => 
                        group.conditions.map((condition, index) => {
                          const field = fields.find(f => f.id === condition.field);
                          if (!field) return null;
                          
                          const operatorText = {
                            'equals': '=',
                            'not_equals': '≠',
                            'contains': 'contains',
                            'not_contains': 'does not contain',
                            'starts_with': 'starts with',
                            'ends_with': 'ends with',
                            'greater_than': '>',
                            'less_than': '<',
                            'greater_than_or_equal': '≥',
                            'less_than_or_equal': '≤',
                            'is_empty': 'is empty',
                            'is_not_empty': 'is not empty'
                          }[condition.operator] || condition.operator;
                          
                          return (
                            <div key={`${groupIndex}-${index}`} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                              <span className="font-medium">{field.name}</span>
                              <span className="text-primary/70">{operatorText}</span>
                              {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                                <span className="font-medium">"{condition.value}"</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={filters.conditions.length > 0 || filters.groups.length > 0 ? "default" : "outline"}
                size="sm" 
                className="gap-2"
                style={{ backgroundColor: 'hsl(var(--filter-button-bg))', color: 'white' }}
                onClick={() => setFilterDialog(true)}
              >
                <Filter className="h-4 w-4" />
                Filter
                {(filters.conditions.length > 0 || filters.groups.length > 0) && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded-full">
                    {filters.conditions.length + filters.groups.reduce((acc, g) => acc + g.conditions.length, 0)}
                  </span>
                )}
              </Button>
              <Button 
                variant={groupByField ? "default" : "outline"}
                size="sm" 
                className="gap-2"
                style={{ backgroundColor: '#24333E', color: 'white' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Group button clicked - event triggered');
                  try {
                    setGroupByDialog(true);
                    console.log('Group dialog state set to true');
                  } catch (error) {
                    console.error('Error setting group dialog:', error);
                  }
                }}
              >
                <Group className="h-4 w-4" />
                Group
                {groupByField && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded-full">
                    1
                  </span>
                )}
              </Button>
              <Button
                variant={sorts.length > 0 ? "default" : "outline"}
                size="sm"
                className="gap-2"
                style={{ backgroundColor: '#24333E', color: 'white' }}
                onClick={() => setSortDialog(true)}
              >
                <Sort className="h-4 w-4" />
                Sort
                {sorts.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded-full">
                    {sorts.length}
                  </span>
                )}
              </Button>
              <Button onClick={addField} variant="outline" size="sm" className="gap-2" style={{ backgroundColor: '#24333E', color: 'white' }}>
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
              <Button onClick={addRecord} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
              <TableHistoryDialog 
                tableId={tableId || ''} 
                tableName={table?.name || 'Table'} 
                onRestoreCallback={loadTableData}
              />
              <ShareDialog tableId={tableId} tableName={table?.name || 'Table'} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-full mx-auto p-6">
        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            
            
          </div>
        </div>

        {/* Grid Table */}
        <div className="border rounded-lg bg-card overflow-hidden w-full">
          <div className="overflow-auto max-w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {fields.map(field => <TableHead key={field.id} className="font-medium border-r min-w-[200px] p-0">
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
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={fields.length + 1} className="text-center py-12 text-muted-foreground">
                      No records yet. Click the button below to get started.
                    </TableCell>
                  </TableRow>
                ) : sortedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={fields.length + 1} className="text-center py-12 text-muted-foreground">
                      No records match the current filters.
                    </TableCell>
                  </TableRow>
                ) : groupedRecords ? (
                  // Render grouped records
                  <>
                    {Object.entries(groupedRecords).map(([groupValue, groupRecords]) => (
                      <React.Fragment key={groupValue}>
                        {/* Group Header Row */}
                        <TableRow className="bg-muted/50 hover:bg-muted/70 border-b-2 border-primary/20">
                          <TableCell colSpan={fields.length + 1} className="p-2">
                            <div className="flex items-center justify-between">
                              <Button 
                                variant="ghost" 
                                className="h-8 justify-start gap-2 font-semibold text-foreground p-0"
                                onClick={() => toggleGroupExpansion(groupValue)}
                              >
                                <div className={cn(
                                  "transition-transform duration-200 text-xs",
                                  expandedGroups.has(groupValue) ? "rotate-90" : "rotate-0"
                                )}>
                                  ▶
                                </div>
                                <span className="font-semibold">{groupValue}</span>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  ({groupRecords.length})
                                </span>
                              </Button>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Add a new record to this group
                                    const groupField = fields.find(f => f.id === groupByField);
                                    if (groupField && groupByField) {
                                      console.log('Adding record to group:', groupValue, 'for field:', groupField.name);
                                      // Create new record with the group value pre-filled
                                      const initialData = {
                                        [groupByField]: groupValue === '(Empty)' ? '' : groupValue
                                      };
                                      addRecord(initialData);
                                    }
                                  }}
                                  title={`Add new record to ${groupValue} group`}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Add to group
                                </span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Group Records - only show if expanded */}
                        {expandedGroups.has(groupValue) && groupRecords.map(record => (
                          <TableRow key={record.id} className="hover:bg-muted/30 border-l-4 border-l-primary/30">
                            {fields.map(field => (
                              <TableCell key={field.id} className="border-r p-0 h-12">
                                {renderEditableCell(record, field)}
                              </TableCell>
                            ))}
                            <TableCell className="p-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                                  <DropdownMenuItem onClick={() => duplicateRecord(record.id)}>
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive" 
                                    onClick={() => deleteRecord(record.id)}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  // Render regular (ungrouped) records
                  sortedRecords.map(record => (
                    <TableRow key={record.id} className="hover:bg-muted/30">
                      {fields.map(field => (
                        <TableCell key={field.id} className="border-r p-0 h-12">
                          {renderEditableCell(record, field)}
                        </TableCell>
                      ))}
                      <TableCell className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                            <DropdownMenuItem onClick={() => duplicateRecord(record.id)}>
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => deleteRecord(record.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                
                {/* Add Record Button Row - only show when not grouped or at bottom */}
                {!groupedRecords && (
                  <TableRow className="hover:bg-muted/20 border-t-2 border-dashed border-muted">
                    <TableCell colSpan={fields.length + 1} className="p-0">
                      <Button 
                        onClick={() => addRecord()} 
                        variant="ghost" 
                        className="w-full h-12 justify-start gap-3 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20">
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">Add new record</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Attachment Preview Dialog */}
      {previewAttachments && <AttachmentPreviewDialog isOpen={!!previewAttachments} onClose={() => setPreviewAttachments(null)} attachments={previewAttachments.attachments} fieldName={previewAttachments.fieldName} onUpdate={newAttachments => {
      updateCellValue(previewAttachments.recordId, previewAttachments.fieldId, newAttachments);
      setPreviewAttachments({
        ...previewAttachments,
        attachments: newAttachments
      });
    }} />}

      {/* Formula Editor Dialog */}
      {formulaEditor && <FormulaEditor isOpen={!!formulaEditor} onClose={() => setFormulaEditor(null)} onSave={async formula => {
      try {
        const {
          error
        } = await supabase.from('base_fields').update({
          field_config: {
            ...fields.find(f => f.id === formulaEditor.fieldId)?.field_config,
            formula
          }
        }).eq('id', formulaEditor.fieldId);
        if (error) throw error;

        // Update local state
        setFields(fields.map(f => f.id === formulaEditor.fieldId ? {
          ...f,
          field_config: {
            ...f.field_config,
            formula
          }
        } : f));
        toast({
          title: "Success",
          description: "Formula updated successfully"
        });
      } catch (error) {
        console.error('Error updating formula:', error);
        toast({
          title: "Error",
          description: "Failed to update formula",
          variant: "destructive"
        });
      }
    }} initialFormula={formulaEditor.initialFormula} fields={fields} sampleRecord={records[0]?.data || {}} />}

      {/* Formula Type Change Confirmation Dialog */}
      <Dialog open={formulaTypeChangeDialog.isOpen} onOpenChange={open => !open && setFormulaTypeChangeDialog({
      isOpen: false,
      fieldId: null,
      pendingType: ''
    })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Convert to Formula Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You're about to convert this field to a formula field. Please enter a valid formula to proceed.
              Formula fields automatically calculate values based on other fields in your table.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Formula Help:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reference fields using curly braces: <code className="bg-background px-1 rounded">{`{Field Name}`}</code></li>
                <li>• Use functions like: <code className="bg-background px-1 rounded">IF(condition, true_value, false_value)</code></li>
                <li>• Combine text with: <code className="bg-background px-1 rounded">{`{First Name} & " " & {Last Name}`}</code></li>
                <li>• Work with dates: <code className="bg-background px-1 rounded">{`DATETIME_DIFF({End Date}, {Start Date}, 'days')`}</code></li>
              </ul>
            </div>

            <FormulaEditor isOpen={true} onClose={() => setFormulaTypeChangeDialog({
            isOpen: false,
            fieldId: null,
            pendingType: ''
          })} onSave={async formula => {
            if (!formula.trim()) {
              toast({
                title: "Error",
                description: "Please enter a valid formula",
                variant: "destructive"
              });
              return;
            }
            try {
              const fieldConfig = {
                formula
              };
              const {
                error
              } = await supabase.from('base_fields').update({
                field_type: 'formula',
                field_config: fieldConfig
              }).eq('id', formulaTypeChangeDialog.fieldId);
              if (error) throw error;
              setFields(fields.map(f => f.id === formulaTypeChangeDialog.fieldId ? {
                ...f,
                field_type: 'formula',
                field_config: fieldConfig
              } : f));
              toast({
                title: "Success",
                description: "Field converted to formula successfully"
              });
              setFormulaTypeChangeDialog({
                isOpen: false,
                fieldId: null,
                pendingType: ''
              });
            } catch (error) {
              console.error('Error converting to formula field:', error);
              toast({
                title: "Error",
                description: "Failed to convert field to formula",
                variant: "destructive"
              });
            }
          }} initialFormula="" fields={fields} sampleRecord={records[0]?.data || {}} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Field Configuration Dialog */}
      <FieldConfigDialog isOpen={fieldConfigDialog.isOpen} onClose={() => setFieldConfigDialog({
      isOpen: false,
      field: null
    })} onSave={async config => {
      if (!fieldConfigDialog.field) return;
      try {
        const {
          error
        } = await supabase.from('base_fields').update({
          field_config: config
        }).eq('id', fieldConfigDialog.field.id);
        if (error) throw error;
        setFields(fields.map(f => f.id === fieldConfigDialog.field!.id ? {
          ...f,
          field_config: config
        } : f));
        toast({
          title: "Success",
          description: "Field configuration updated"
        });
      } catch (error) {
        console.error('Error updating field config:', error);
        toast({
          title: "Error",
          description: "Failed to update field configuration",
          variant: "destructive"
        });
      }
    }} field={fieldConfigDialog.field} />

        {/* Group By Dialog */}
        <GroupByDialog
          isOpen={groupByDialog}
          onClose={() => {
            console.log('GroupByDialog closed');
            setGroupByDialog(false);
          }}
          fields={fields}
          currentGroupBy={groupByField}
          onApplyGroupBy={handleGroupByApply}
        />

        {/* Sort Dialog */}
        <TableSortDialog
          isOpen={sortDialog}
          onClose={() => setSortDialog(false)}
          fields={fields}
          currentSorts={sorts}
          onApplySorts={(newSorts) => {
            setSorts(newSorts);
            // Update current view if one is selected
            if (currentView) {
              updateViewData(currentView.id, { sorts: newSorts });
            }
          }}
          groupByField={groupByField}
          automaticSort={automaticSort}
          onAutomaticSortChange={(enabled) => {
            setAutomaticSort(enabled);
            // Update current view if one is selected
            if (currentView) {
              updateViewSettings(currentView.id, { automaticSort: enabled });
            }
          }}
        />

        {/* Filter Dialog */}
        <TableFilterDialog
          isOpen={filterDialog}
          onClose={() => setFilterDialog(false)}
          fields={fields}
          onApplyFilters={(newFilters) => {
            setFilters(newFilters);
            // Update current view if one is selected
            if (currentView) {
              updateViewData(currentView.id, {
                filters: newFilters.conditions as any,
                groups: newFilters.groups as any
              });
            }
          }}
          initialFilters={filters}
        />

        {/* Context Menu */}
      {contextMenu.isOpen && <div className="fixed bg-background border shadow-lg rounded-md py-1 z-50 min-w-48" style={{
      left: contextMenu.x,
      top: contextMenu.y
    }} onClick={e => e.stopPropagation()}>
          <button className="w-full px-3 py-2 text-left hover:bg-muted text-sm" onClick={() => {
        const field = fields.find(f => f.id === contextMenu.fieldId);
        if (field) {
          handleFieldDoubleClick(field.id, field.name);
        }
        setContextMenu({
          isOpen: false,
          x: 0,
          y: 0,
          fieldId: null
        });
      }}>
            Rename Field
          </button>
          
          {['single_select', 'multi_select', 'rating', 'currency', 'number', 'percent'].includes(fields.find(f => f.id === contextMenu.fieldId)?.field_type || '') && <button className="w-full px-3 py-2 text-left hover:bg-muted text-sm" onClick={() => {
        const field = fields.find(f => f.id === contextMenu.fieldId);
        if (field) {
          setFieldConfigDialog({
            isOpen: true,
            field
          });
        }
        setContextMenu({
          isOpen: false,
          x: 0,
          y: 0,
          fieldId: null
        });
      }}>
              Configure Options
            </button>}
          
          {fields.find(f => f.id === contextMenu.fieldId)?.field_type === 'formula' && <button className="w-full px-3 py-2 text-left hover:bg-muted text-sm" onClick={() => {
        const field = fields.find(f => f.id === contextMenu.fieldId);
        if (field) {
          setFormulaEditor({
            fieldId: field.id,
            initialFormula: field.field_config?.formula || ''
          });
        }
        setContextMenu({
          isOpen: false,
          x: 0,
          y: 0,
          fieldId: null
        });
      }}>
              Edit Formula
            </button>}
          
          <hr className="my-1" />
          
          <button className="w-full px-3 py-2 text-left hover:bg-muted text-sm text-destructive" onClick={() => {
        if (contextMenu.fieldId) {
          deleteField(contextMenu.fieldId);
        }
        setContextMenu({
          isOpen: false,
          x: 0,
          y: 0,
          fieldId: null
        });
      }}>
            Delete Field
          </button>
         </div>}

        {/* Multi-select context menu */}
        {multiSelectContextMenu.isOpen && (
          <div 
            className="fixed bg-background border shadow-lg rounded-md py-1 z-[9999] min-w-48" 
            style={{ left: multiSelectContextMenu.x, top: multiSelectContextMenu.y }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-xs text-muted-foreground border-b">
              {selectedCells.size} cell{selectedCells.size !== 1 ? 's' : ''} selected
            </div>
            <button 
              className="w-full px-3 py-2 text-left hover:bg-muted text-sm flex items-center gap-2"
              onClick={deleteSelectedCells}
            >
              <Trash2 className="h-4 w-4" />
              Clear cells
            </button>
            <button 
              className="w-full px-3 py-2 text-left hover:bg-muted text-sm flex items-center gap-2"
              onClick={deleteSelectedRows}
            >
              <Trash2 className="h-4 w-4" />
              Delete rows
            </button>
            <hr className="my-1" />
            <button 
              className="w-full px-3 py-2 text-left hover:bg-muted text-sm flex items-center gap-2"
              onClick={addRowAbove}
            >
              <Plus className="h-4 w-4" />
              Add row above
            </button>
            <button 
              className="w-full px-3 py-2 text-left hover:bg-muted text-sm flex items-center gap-2"
              onClick={addRowBelow}
            >
              <Plus className="h-4 w-4" />
              Add row below
            </button>
          </div>
        )}
      </div>
    </div>
  );
};