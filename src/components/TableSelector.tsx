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
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchTables = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from('base_tables')
          .select('id, name')
          .eq('company_id', profile.company_id)
          .order('name');

        if (error) {
          console.error('Error fetching tables:', error);
          return;
        }

        setTables(data || []);
      } catch (error) {
        console.error('Error fetching tables:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
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
        <Select value={value || ''} onValueChange={onTableChange} disabled={loading}>
          <SelectTrigger className="flex-1 bg-white">
            <SelectValue placeholder={loading ? "Loading tables..." : "Select a table..."} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-border shadow-md max-h-60 z-50">
            {tables.length === 0 ? (
              <SelectItem value="" disabled>
                No tables available
              </SelectItem>
            ) : (
              tables.map((table) => (
                <SelectItem key={table.id} value={table.id}>
                  {table.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};