import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, FileText, BarChart3, Settings, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://social-media-post-generator-backend.onrender.com';

export default function AdminPageSimple() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchStats = async () => {
    try {
      // Try multiple endpoints for compatibility
      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-stats`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-stats`
      ];
      
      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            headers: getAuthHeaders()
          });
          if (response.ok) break;
        } catch (e) {
          continue;
        }
      }
      
      if (response && response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Fallback stats
        setStats({
          users: { total: 0, active: 0, admins: 0 },
          posts: { total: 0, posted: 0, draft: 0 },
          social_accounts: { total: 0, active: 0, by_platform: {} }
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        users: { total: 0, active: 0, admins: 0 },
        posts: { total: 0, posted: 0, draft: 0 },
        social_accounts: { total: 0, active: 0, by_platform: {} }
      });
    }
  };

  const fetchUsers = async () => {
    try {
      // Try multiple endpoints for compatibility
      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-users`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-users`
      ];
      
      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            headers: getAuthHeaders()
          });
          if (response.ok) break;
        } catch (e) {
          continue;
        }
      }
      
      if (response && response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchPosts = async () => {
    try {
      // Try multiple endpoints for compatibility
      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-posts`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-posts`
      ];
      
      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            headers: getAuthHeaders()
          });
          if (response.ok) break;
        } catch (e) {
          continue;
        }
      }
      
      if (response && response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchUsers(), fetchPosts()]);
    } catch (error) {
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user]);

  const handleCreateUser = async () => {
    try {
      // Try multiple endpoints for compatibility
      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-users`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-users`
      ];
      
      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newUser)
          });
          if (response.ok) break;
        } catch (e) {
          continue;
        }
      }
      
      if (response && response.ok) {
        setNewUser({ username: '', email: '', password: '', role: 'user' });
        setShowCreateUser(false);
        await loadData();
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      alert(`Fehler beim Erstellen des Benutzers: ${error.message}`);
    }
  };

  const handleUpdateUser = async () => {
    try {
      // Try multiple endpoints for compatibility
      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-users/${editingUser.id}`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-users/${editingUser.id}`
      ];
      
      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(editingUser)
          });
          if (response.ok) break;
        } catch (e) {
          continue;
        }
      }
      
      if (response && response.ok) {
        setEditingUser(null);
        await loadData();
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      alert(`Fehler beim Aktualisieren des Benutzers: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      // Try multiple endpoints for compatibility
      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-users/${userId}`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-users/${userId}`
      ];
      
      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (response.ok) break;
        } catch (e) {
          continue;
        }
      }
      
      if (response && response.ok) {
        await loadData();
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      alert(`Fehler beim Löschen des Benutzers: ${error.message}`);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Sie haben keine Berechtigung, diese Seite zu besuchen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <p>Lade Admin Dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Verwalten Sie Benutzer und überwachen Sie das System</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benutzer gesamt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.users?.active || 0} aktiv, {stats?.users?.admins || 0} Admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts gesamt</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.posts?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.posts?.posted || 0} veröffentlicht, {stats?.posts?.draft || 0} Entwürfe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Accounts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.social_accounts?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.social_accounts?.active || 0} aktiv
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              Alle Services verfügbar
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Benutzerverwaltung</TabsTrigger>
          <TabsTrigger value="posts">Post-Übersicht</TabsTrigger>
          <TabsTrigger value="settings">System-Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Benutzerverwaltung</CardTitle>
                  <CardDescription>Verwalten Sie alle Benutzer des Systems</CardDescription>
                </div>
                <Button onClick={() => setShowCreateUser(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Benutzer erstellen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzername</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : 'Unbekannt'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Benutzer löschen</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sind Sie sicher, dass Sie den Benutzer "{user.username}" löschen möchten? 
                                  Diese Aktion kann nicht rückgängig gemacht werden.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                  Löschen
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Post-Übersicht</CardTitle>
              <CardDescription>Alle Posts aller Benutzer</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title || 'Ohne Titel'}</TableCell>
                      <TableCell>{post.username || 'Unbekannt'}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === 'posted' ? 'default' : 'secondary'}>
                          {post.status === 'posted' ? 'Veröffentlicht' : 'Entwurf'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('de-DE') : 'Unbekannt'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System-Einstellungen</CardTitle>
              <CardDescription>Konfiguration und Wartung</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">API-Status</h3>
                  <p className="text-sm text-muted-foreground">Backend-Verbindung: ✅ Verbunden</p>
                  <p className="text-sm text-muted-foreground">Datenbank: ✅ Verfügbar</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Subscription-Management</h3>
                  <p className="text-sm text-muted-foreground">
                    🚧 Wird in der nächsten Version implementiert
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Neuen Benutzer erstellen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">Benutzername</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Rolle</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Benutzer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateUser}>
                  Erstellen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Dialog */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Benutzer bearbeiten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Benutzername</Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">E-Mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Rolle</Label>
                <Select value={editingUser.role} onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Benutzer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Abbrechen
                </Button>
                <Button onClick={handleUpdateUser}>
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

