import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Table {
  id: string;
  name: string;
}

interface TableSelectorProps {
  value?: string;
  displayName?: string;
  onTableChange: (tableId: string) => void;
  onDisplayNameChange: (displayName: string) => void;
  label: string;
}

export const TableSelector = ({
  value,
  displayName,
  onTableChange,
  onDisplayNameChange,
  label
}: TableSelectorProps) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false); // Set to false since BASE is not available
  const { profile } = useAuth();

  // No longer fetch tables since BASE functionality has been removed
  // Keep component for compatibility but disable functionality
  useEffect(() => {
    // BASE functionality removed - no tables to fetch
    setTables([]);
    setLoading(false);
  }, [profile?.company_id]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <Input
          value={displayName || ''}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Display name (optional)"
          className="flex-1 bg-white"
        />
        <Select value={value || ''} onValueChange={onTableChange} disabled={true}>
          <SelectTrigger className="flex-1 bg-white">
            <SelectValue placeholder="No tables available" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-border shadow-md max-h-60 z-50">
            <SelectItem value="" disabled>
              BASE functionality not available
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};