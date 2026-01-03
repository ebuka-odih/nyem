import { useState } from 'react';
import { router } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Trash2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  phone: string;
  city: string;
  role: string;
  created_at: string;
  items_count: number;
  swipes_count: number;
  matches_as_user1_count: number;
  matches_as_user2_count: number;
}

interface Props {
  users: {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: {
    search?: string;
    role?: string;
  };
}

export default function Users({ users, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState('');

  const handleSearch = () => {
    router.get('/admin/users', {
      search: search || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    router.put(`/api/admin/users/${selectedUser.id}`, {
      role: editRole,
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        router.reload();
      },
      onError: (errors) => {
        alert(errors.message || 'Failed to update user');
      },
    });
  };

  const handleDelete = (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    router.delete(`/api/admin/users/${userId}`, {
      onSuccess: () => {
        router.reload();
      },
      onError: (errors) => {
        alert(errors.message || 'Failed to delete user');
      },
    });
  };

  const getTotalMatches = (user: User) => {
    return (user.matches_as_user1_count || 0) + (user.matches_as_user2_count || 0);
  };

  return (
    <AdminLayout currentPath="/admin/users">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage platform users</p>
        </div>

        <Card className="p-6 bg-card border-border">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-background border-input text-foreground"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48 bg-background border-input">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="standard_user">Standard User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.city}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.items_count || 0}</TableCell>
                  <TableCell>{getTotalMatches(user)}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          )}

          {users.last_page > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                disabled={users.current_page === 1}
                onClick={() => router.get('/admin/users', {
                  ...filters,
                  page: users.current_page - 1,
                })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {users.current_page} of {users.last_page}
              </span>
              <Button
                variant="outline"
                disabled={users.current_page === users.last_page}
                onClick={() => router.get('/admin/users', {
                  ...filters,
                  page: users.current_page + 1,
                })}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard_user">Standard User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}






