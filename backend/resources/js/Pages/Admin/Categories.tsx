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
import { Search, Edit, Trash2, Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'main' | 'sub';
  parent_id: number | null;
  parent?: Category | null;
  children?: Category[];
  slug: string | null;
  icon: string | null;
  order: number;
  created_at: string;
}

interface MainCategory {
  id: string;
  name: string;
}

interface Props {
  categories: {
    data: Category[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  mainCategories: MainCategory[];
  filters: {
    search?: string;
    type?: string;
  };
}

export default function Categories({ categories, mainCategories, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'main' as 'main' | 'sub',
    parent_id: '',
    slug: '',
    icon: '',
    order: '',
  });

  const handleSearch = () => {
    router.get('/admin/categories', {
      search: search || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      type: 'main',
      parent_id: '',
      slug: '',
      icon: '',
      order: '',
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      parent_id: category.parent_id?.toString() || '',
      slug: category.slug || '',
      icon: category.icon || '',
      order: category.order.toString(),
    });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    const payload: any = {
      name: formData.name,
      type: formData.type,
      slug: formData.slug || undefined,
      icon: formData.icon || undefined,
      order: formData.order ? parseInt(formData.order) : undefined,
    };

    if (formData.type === 'sub' && formData.parent_id) {
      payload.parent_id = parseInt(formData.parent_id);
    }

    if (selectedCategory) {
      // Update existing category
      router.put(`/api/admin/categories/${selectedCategory.id}`, payload, {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedCategory(null);
          router.reload();
        },
        onError: (errors) => {
          const errorMessage = errors.message || Object.values(errors).flat().join(', ') || 'Failed to update category';
          alert(errorMessage);
        },
      });
    } else {
      // Create new category
      router.post('/api/admin/categories', payload, {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setFormData({
            name: '',
            type: 'main',
            parent_id: '',
            slug: '',
            icon: '',
            order: '',
          });
          router.reload();
        },
        onError: (errors) => {
          const errorMessage = errors.message || Object.values(errors).flat().join(', ') || 'Failed to create category';
          alert(errorMessage);
        },
      });
    }
  };

  const handleDelete = (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    router.delete(`/api/admin/categories/${categoryId}`, {
      onSuccess: () => {
        router.reload();
      },
      onError: (errors) => {
        const errorMessage = errors.message || Object.values(errors).flat().join(', ') || 'Failed to delete category';
        alert(errorMessage);
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'main',
      parent_id: '',
      slug: '',
      icon: '',
      order: '',
    });
    setSelectedCategory(null);
  };

  return (
    <AdminLayout currentPath="/admin/categories">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground mt-1">Manage platform categories</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        <Card className="p-6 bg-card border-border">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-background border-input text-foreground"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-background border-input">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="main">Main Categories</SelectItem>
                <SelectItem value="sub">Sub Categories</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant={category.type === 'main' ? 'default' : 'secondary'}>
                      {category.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.parent?.name || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.slug || '-'}
                  </TableCell>
                  <TableCell>{category.order}</TableCell>
                  <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {categories.data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No categories found</div>
          )}

          {categories.last_page > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                disabled={categories.current_page === 1}
                onClick={() => router.get('/admin/categories', {
                  ...filters,
                  page: categories.current_page - 1,
                })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {categories.current_page} of {categories.last_page}
              </span>
              <Button
                variant="outline"
                disabled={categories.current_page === categories.last_page}
                onClick={() => router.get('/admin/categories', {
                  ...filters,
                  page: categories.current_page + 1,
                })}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Category name"
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'main' | 'sub') => {
                    setFormData({ ...formData, type: value, parent_id: value === 'main' ? '' : formData.parent_id });
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Category</SelectItem>
                    <SelectItem value="sub">Sub Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === 'sub' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Parent Category</label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Slug (optional)</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-friendly-slug"
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Icon (optional)</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="icon-name"
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Order (optional)</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  placeholder="0"
                  className="bg-background"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!formData.name || (formData.type === 'sub' && !formData.parent_id)}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            resetForm();
            setSelectedCategory(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Category name"
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'main' | 'sub') => {
                    setFormData({ ...formData, type: value, parent_id: value === 'main' ? '' : formData.parent_id });
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Category</SelectItem>
                    <SelectItem value="sub">Sub Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === 'sub' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Parent Category</label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Slug (optional)</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-friendly-slug"
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Icon (optional)</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="icon-name"
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Order (optional)</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  placeholder="0"
                  className="bg-background"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                  setSelectedCategory(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!formData.name || (formData.type === 'sub' && !formData.parent_id)}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}







