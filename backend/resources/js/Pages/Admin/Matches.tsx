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
import { Search, Trash2 } from 'lucide-react';

interface Match {
  id: string;
  user1: { id: string; username: string };
  user2: { id: string; username: string };
  item1: { id: string; title: string };
  item2: { id: string; title: string };
  created_at: string;
}

interface Props {
  matches: {
    data: Match[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: {
    search?: string;
  };
}

export default function Matches({ matches, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch = () => {
    router.get('/admin/matches', {
      search: search || undefined,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;
    router.delete(`/api/admin/matches/${matchId}`, {
      onSuccess: () => {
        router.reload();
      },
      onError: (errors) => {
        alert(errors.message || 'Failed to delete match');
      },
    });
  };

  return (
    <AdminLayout currentPath="/admin/matches">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Matches</h1>
          <p className="text-muted-foreground mt-1">View and manage user matches</p>
        </div>

        <Card className="p-6 bg-card border-border">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search by username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-background border-input text-foreground"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User 1</TableHead>
                <TableHead>Item 1</TableHead>
                <TableHead>User 2</TableHead>
                <TableHead>Item 2</TableHead>
                <TableHead>Matched</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.data.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className="font-medium">{match.user1?.username || 'N/A'}</TableCell>
                  <TableCell>{match.item1?.title || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{match.user2?.username || 'N/A'}</TableCell>
                  <TableCell>{match.item2?.title || 'N/A'}</TableCell>
                  <TableCell>{new Date(match.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(match.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {matches.data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No matches found</div>
          )}

          {matches.last_page > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                disabled={matches.current_page === 1}
                onClick={() => router.get('/admin/matches', {
                  ...filters,
                  page: matches.current_page - 1,
                })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {matches.current_page} of {matches.last_page}
              </span>
              <Button
                variant="outline"
                disabled={matches.current_page === matches.last_page}
                onClick={() => router.get('/admin/matches', {
                  ...filters,
                  page: matches.current_page + 1,
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






