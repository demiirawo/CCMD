import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
type UserPermission = 'read' | 'edit' | 'company_admin';
interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  permission: UserPermission;
  created_at: string;
}
interface TeamMembersManagerProps {
  companyId: string;
}
const PERMISSION_LABELS = {
  read: 'Read',
  edit: 'Edit',
  company_admin: 'Company Admin'
};
const PERMISSION_DESCRIPTIONS = {
  read: 'Can access company, view dashboard and reports',
  edit: 'Can add and edit content (not settings)',
  company_admin: 'Full access including delete and settings'
};
export const TeamMembersManager = ({
  companyId
}: TeamMembersManagerProps) => {
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMember, setNewMember] = useState<{
    name: string;
    email: string;
    permission: UserPermission;
  }>({
    name: '',
    email: '',
    permission: 'read'
  });
  const canManageTeam = (profile as any)?.permission === 'company_admin' || profile?.role === 'admin';
  useEffect(() => {
    fetchTeamMembers();
  }, [companyId]);
  const fetchTeamMembers = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('team_members').select('*').eq('company_id', companyId).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members.",
        variant: "destructive"
      });
    }
  };
  const handleAddMember = async () => {
    if (!newMember.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the team member.",
        variant: "destructive"
      });
      return;
    }
    if (!newMember.email.trim()) {
      toast({
        title: "Email required",
        description: "Email is required for magic link authentication.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('team_members').insert({
        company_id: companyId,
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        permission: newMember.permission
      });
      if (error) throw error;
      setNewMember({
        name: '',
        email: '',
        permission: 'read'
      });
      await fetchTeamMembers();
      toast({
        title: "Team member added",
        description: `${newMember.name} has been added to the team.`
      });
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleUpdatePermission = async (memberId: string, permission: UserPermission) => {
    try {
      const {
        error
      } = await supabase.from('team_members').update({
        permission
      }).eq('id', memberId);
      if (error) throw error;
      await fetchTeamMembers();
      toast({
        title: "Permission updated",
        description: "Team member permission has been updated."
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;
    try {
      const {
        error
      } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) throw error;
      await fetchTeamMembers();
      toast({
        title: "Team member removed",
        description: `${memberName} has been removed from the team.`
      });
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member.",
        variant: "destructive"
      });
    }
  };
  return <Card className="bg-stone-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Office Team
        </CardTitle>
        <CardDescription>
          Manage team members and their permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new team member */}
        {canManageTeam && <div className="p-4 border rounded-lg bg-white space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Team Member
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="member-name">Name *</Label>
                <Input id="member-name" value={newMember.name} onChange={e => setNewMember(prev => ({
              ...prev,
              name: e.target.value
            }))} placeholder="Enter name" />
              </div>
              <div>
                <Label htmlFor="member-email">Email *</Label>
                <Input id="member-email" type="email" value={newMember.email} onChange={e => setNewMember(prev => ({
              ...prev,
              email: e.target.value
            }))} placeholder="Enter email (required for login)" />
              </div>
              <div>
                <Label htmlFor="member-permission">Permission</Label>
                <Select value={newMember.permission} onValueChange={(value: UserPermission) => setNewMember(prev => ({
              ...prev,
              permission: value
            }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERMISSION_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {PERMISSION_DESCRIPTIONS[value as keyof typeof PERMISSION_DESCRIPTIONS]}
                          </span>
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddMember} disabled={loading || !newMember.name.trim() || !newMember.email.trim()} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>}

        {/* Team members list */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Team Members ({teamMembers.length})
          </h4>
          
          {teamMembers.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No team members added yet</p>
              {canManageTeam && <p className="text-sm">Add team members using the form above</p>}
            </div> : <div className="space-y-2">
              {teamMembers.map(member => <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div className="flex-1">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {canManageTeam ? <Select value={member.permission} onValueChange={(value: UserPermission) => handleUpdatePermission(member.id, value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PERMISSION_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>)}
                        </SelectContent>
                      </Select> : <span className="text-sm px-3 py-1 bg-muted rounded-md">
                        {PERMISSION_LABELS[member.permission]}
                      </span>}
                    
                    {canManageTeam && <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(member.id, member.name)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>}
                  </div>
                </div>)}
            </div>}
        </div>

        {/* Permission descriptions */}
        
      </CardContent>
    </Card>;
};