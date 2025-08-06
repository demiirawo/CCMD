
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, Edit, Trash2, Mail, AlertTriangle } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  role: 'admin' | 'user';
  permission: 'read' | 'edit' | 'company_admin';
  company_id: string | null;
  created_at: string;
  companies?: {
    name: string;
  };
}

interface EditUserData {
  username: string;
  role: 'admin' | 'user';
  permission: 'read' | 'edit' | 'company_admin';
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editData, setEditData] = useState<EditUserData>({
    username: '',
    role: 'user',
    permission: 'read'
  });
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching all user profiles...');
      
      // Get all profiles with company information
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          companies:company_id (name)
        `);

      if (profilesError) throw profilesError;

      console.log('Fetched user profiles:', profiles);
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditData({
      username: user.username || '',
      role: user.role,
      permission: user.permission
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editData.username,
          role: editData.role,
          permission: editData.permission
        })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User updated successfully'
      });

      setEditDialogOpen(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (userId: string, username?: string) => {
    try {
      // We can only delete from profiles table with current permissions
      // The auth user will remain but won't have profile access
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) throw profileError;
      
      toast({
        title: 'Success',
        description: `User profile for ${username} has been removed from the system`,
        variant: 'default'
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user profile',
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case 'company_admin':
        return 'bg-purple-100 text-purple-800';
      case 'edit':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading users...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management ({users.length} users)
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4" />
          <span>Limited access: Email addresses require service role permissions</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.user_id.slice(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{user.username || 'Not set'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissionBadgeColor(user.permission)}`}>
                      {user.permission}
                    </span>
                  </TableCell>
                  <TableCell>{user.companies?.name || 'No company'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive-foreground hover:bg-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User Profile</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the profile for "{user.username}"? This will remove their access to the application but the auth user will remain in the system. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteUser(user.user_id, user.username)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Profile
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details and permissions for {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editData.role} onValueChange={(value: 'admin' | 'user') => setEditData({ ...editData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-permission">Permission Level</Label>
                <Select value={editData.permission} onValueChange={(value: 'read' | 'edit' | 'company_admin') => setEditData({ ...editData, permission: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="edit">Editor</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
