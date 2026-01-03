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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Trash2, Share2 } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  description: string;
  category: { name: string } | null;
  status: string;
  user: { id: string; username: string } | null;
  created_at: string;
}

interface Props {
  items: {
    data: Item[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: {
    search?: string;
    status?: string;
    category?: string;
  };
}

export default function Items({ items, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

  const handleSearch = () => {
    router.get('/admin/items', {
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    router.delete(`/api/admin/items/${itemId}`, {
      onSuccess: () => {
        router.reload();
      },
      onError: (errors) => {
        alert(errors.message || 'Failed to delete item');
      },
    });
  };

  const handleStatusChange = (itemId: string, status: string) => {
    router.put(`/api/admin/items/${itemId}`, {
      status,
    }, {
      onSuccess: () => {
        router.reload();
      },
      onError: (errors) => {
        alert(errors.message || 'Failed to update item');
      },
    });
  };

  const handleShare = async (item: Item) => {
    try {
      const shareUrl = `${window.location.origin}/items/${item.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Item link copied to clipboard!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to share item:', err);
      }
    }
  };

  return (
    <AdminLayout currentPath="/admin/items">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Items</h1>
          <p className="text-muted-foreground mt-1">Manage platform items</p>
        </div>

        <Card className="p-6 bg-card border-border">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-background border-input text-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-background border-input">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex-1">{item.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Share2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{item.category?.name || 'N/A'}</TableCell>
                  <TableCell>{item.user?.username || 'N/A'}</TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) => handleStatusChange(item.id, value)}
                    >
                      <SelectTrigger className="w-32 bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {items.data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No items found</div>
          )}

          {items.last_page > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                disabled={items.current_page === 1}
                onClick={() => router.get('/admin/items', {
                  ...filters,
                  page: items.current_page - 1,
                })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {items.current_page} of {items.last_page}
              </span>
              <Button
                variant="outline"
                disabled={items.current_page === items.last_page}
                onClick={() => router.get('/admin/items', {
                  ...filters,
                  page: items.current_page + 1,
                })}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}






