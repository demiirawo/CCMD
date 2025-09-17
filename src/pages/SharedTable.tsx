import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  share_type: string;
}

export const SharedTable = () => {
  const { token } = useParams<{ token: string }>();
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateAccess = async (passwordToTry?: string) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('validate-share-access', {
        body: {
          share_token: token,
          password: passwordToTry || password
        }
      });

      if (funcError) {
        throw funcError;
      }

      if (data.error) {
        if (data.requires_password) {
          setRequiresPassword(true);
          if (passwordToTry || password) {
            toast({
              title: "Invalid password",
              description: "Please enter the correct password.",
              variant: "destructive"
            });
          }
        } else {
          setError(data.error);
        }
        return;
      }

      setTableData(data);
      setRequiresPassword(false);
    } catch (error: any) {
      console.error('Error validating access:', error);
      setError("Failed to load shared table. The link may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    validateAccess();
  }, [token]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      validateAccess(password);
    }
  };

  const renderCellValue = (field: any, value: any) => {
    if (!value) return '-';

    switch (field.field_type) {
      case 'select':
        return <Badge variant="secondary">{value}</Badge>;
      case 'multiselect':
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
      default:
        return String(value);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading shared table...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Password Required</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This table is password protected. Please enter the password to continue.
              </p>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="submit" className="w-full" disabled={!password.trim()}>
                Access Table
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tableData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
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

        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[calc(100vh-200px)]">
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

        <div className="text-center text-sm text-muted-foreground">
          <p>This is a shared view of "{tableData.table.name}"</p>
        </div>
      </div>
    </div>
  );
};