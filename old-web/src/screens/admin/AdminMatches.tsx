import { useEffect, useState } from 'react';
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
import { Search, Trash2, Eye } from 'lucide-react';
import { getMatches, deleteMatch, getMatch } from '@/services/adminApi';

interface Match {
  id: string;
  user1: { id: string; username: string };
  user2: { id: string; username: string };
  item1: { id: string; title: string };
  item2: { id: string; title: string };
  created_at: string;
}

export default function AdminMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadMatches();
  }, [currentPage, search]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const params: any = {
        per_page: 15,
        page: currentPage,
      };
      if (search) params.search = search;

      const response = await getMatches(params);
      setMatches(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (err: any) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;
    try {
      await deleteMatch(matchId);
      loadMatches();
    } catch (err: any) {
      alert(err.message || 'Failed to delete match');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
          <p className="text-gray-600 mt-1">View and manage user matches</p>
        </div>

        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by username..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <>
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
                  {matches.map((match) => (
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
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {matches.length === 0 && (
                <div className="text-center py-8 text-gray-500">No matches found</div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

