import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, UserCheck, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
type DatabasePermission = 'read' | 'edit' | 'company_admin';
interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  permission: DatabasePermission; // From database
  created_at: string;
}
interface TeamMembersManagerProps {
  companyId: string;
}
export const TeamMembersManager = ({
  companyId
}: TeamMembersManagerProps) => {
  const {
    user,
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState<{
    name: string;
    email: string;
  }>({
    name: '',
    email: ''
  });
  const canManageTeam = (profile as any)?.permission === 'company_admin' || user?.email === 'demi.irawo@care-cuddle.co.uk';
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
    // Check if email already exists in this company (only if email is provided)
    if (newMember.email.trim()) {
      const existingMember = teamMembers.find(
        member => member.email?.toLowerCase() === newMember.email.trim().toLowerCase()
      );
      
      if (existingMember) {
        toast({
          title: "Email already exists",
          description: `A team member with email "${newMember.email}" already exists in this company.`,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('team_members').insert({
        company_id: companyId,
        name: newMember.name.trim(),
        email: newMember.email.trim() || null,
        permission: 'company_admin' // Always company_admin
      });
      if (error) {
        // Handle database constraint violation
        if (error.code === '23505' && error.message.includes('idx_team_members_email_company_unique')) {
          toast({
            title: "Email already exists",
            description: `A team member with email "${newMember.email}" already exists in this company.`,
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      setNewMember({
        name: '',
        email: ''
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
  // Remove the permission update function since everyone is company_admin now
  const handleEditMember = async () => {
    if (!editingMember || !editingMember.name.trim()) {
      toast({
        title: "Invalid input",
        description: "Name is required.",
        variant: "destructive"
      });
      return;
    }

    // Check if email already exists in this company (excluding current member, only if email is provided)
    if (editingMember.email?.trim()) {
      const existingMember = teamMembers.find(
        member => member.id !== editingMember.id && 
                  member.email?.toLowerCase() === editingMember.email?.trim().toLowerCase()
      );
      
      if (existingMember) {
        toast({
          title: "Email already exists",
          description: `A team member with email "${editingMember.email}" already exists in this company.`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const {
        error
      } = await supabase.from('team_members').update({
        name: editingMember.name.trim(),
        email: editingMember.email?.trim() || null
      }).eq('id', editingMember.id);
      if (error) {
        // Handle database constraint violation
        if (error.code === '23505' && error.message.includes('idx_team_members_email_company_unique')) {
          toast({
            title: "Email already exists",
            description: `A team member with email "${editingMember.email}" already exists in this company.`,
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      await fetchTeamMembers();
      setEditingMember(null);
      toast({
        title: "Team member updated",
        description: "Team member details have been updated."
      });
    } catch (error) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: "Failed to update team member.",
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
  return <Card className="bg-[#EAEBEC]">
      <CardHeader>
        <CardTitle>
          Office Team
        </CardTitle>
        
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new team member */}
        {canManageTeam && <div className="p-4 border border-gray-200 rounded-lg bg-white space-y-3">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="member-name">Name *</Label>
                <Input id="member-name" value={newMember.name} onChange={e => setNewMember(prev => ({
              ...prev,
              name: e.target.value
            }))} className="border-gray-200" />
              </div>
              <div>
                <Label htmlFor="member-email">Email</Label>
                <Input id="member-email" type="email" value={newMember.email} onChange={e => setNewMember(prev => ({
              ...prev,
              email: e.target.value
            }))} className="border-gray-200" placeholder="Optional - for login access" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddMember} disabled={loading || !newMember.name.trim()} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>}

        {/* Team members list */}
        <div className="space-y-2">
          <h4 className="font-medium">
            Team Members ({teamMembers.length})
          </h4>
          
          {teamMembers.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No team members added yet</p>
              {canManageTeam && <p className="text-sm">Add team members using the form above</p>}
            </div> : <div className="space-y-2">
              {teamMembers.map(member => {
            if (editingMember?.id === member.id) {
              return <div key={member.id} className="p-3 border rounded-lg bg-white space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="edit-name">Name *</Label>
                          <Input id="edit-name" value={editingMember.name} onChange={e => setEditingMember(prev => prev ? {
                      ...prev,
                      name: e.target.value
                    } : null)} className="border-gray-200" />
                        </div>
                        <div>
                          <Label htmlFor="edit-email">Email</Label>
                          <Input id="edit-email" type="email" value={editingMember.email || ''} onChange={e => setEditingMember(prev => prev ? {
                      ...prev,
                      email: e.target.value
                    } : null)} className="border-gray-200" placeholder="Optional - for login access" />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button onClick={handleEditMember} size="sm" className="flex-1">
                            Save
                          </Button>
                          <Button onClick={() => setEditingMember(null)} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>;
            }
            return <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.email || "Please add email address"}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {canManageTeam && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => setEditingMember(member)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(member.id, member.name)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>;
          })}
            </div>}
        </div>

        {/* Permission descriptions */}
        
      </CardContent>
    </Card>;
};