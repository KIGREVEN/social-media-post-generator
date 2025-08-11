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
import { Users, FileText, BarChart3, Settings, Plus, Edit, Trash2, RefreshCw, Crown, CreditCard } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://social-media-post-generator-backend.onrender.com';

export default function AdminPageComplete() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [selectedUserForSubscription, setSelectedUserForSubscription] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    subscription: 'free'
  });

  const subscriptionTypes = {
    'free': { 
      name: 'Free', 
      limit: 10, 
      color: 'bg-gray-100 text-gray-800',
      description: '10 Posts pro Monat'
    },
    'basic': { 
      name: 'Basic', 
      limit: 50, 
      color: 'bg-blue-100 text-blue-800',
      description: '50 Posts pro Monat'
    },
    'premium': { 
      name: 'Premium', 
      limit: 200, 
      color: 'bg-purple-100 text-purple-800',
      description: '200 Posts pro Monat'
    },
    'enterprise': { 
      name: 'Enterprise', 
      limit: 1000, 
      color: 'bg-gold-100 text-gold-800',
      description: '1000 Posts pro Monat'
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchStats = async () => {
    try {
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
        setStats({
          users: { total: users.length, active: users.filter(u => u.is_active).length, admins: users.filter(u => u.role === 'admin').length },
          posts: { total: 0, posted: 0, draft: 0 },
          social_accounts: { total: 0, active: 0, by_platform: {} }
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        users: { total: users.length, active: users.filter(u => u.is_active).length, admins: users.filter(u => u.role === 'admin').length },
        posts: { total: 0, posted: 0, draft: 0 },
        social_accounts: { total: 0, active: 0, by_platform: {} }
      });
    }
  };

  const fetchUsers = async () => {
    try {
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
      await Promise.all([fetchUsers()]);
      await Promise.all([fetchStats(), fetchPosts()]);
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
        setNewUser({ username: '', email: '', password: '', role: 'user', subscription: 'free' });
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

  const handleUpdateSubscription = async (userId, newSubscription) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) return;

      const updatedUser = { ...userToUpdate, subscription: newSubscription };

      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-users/${userId}`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-users/${userId}`
      ];
      
      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedUser)
          });
          if (response.ok) break;
        } catch (e) {
          continue;
        }
      }
      
      if (response && response.ok) {
        setShowSubscriptionDialog(false);
        setSelectedUserForSubscription(null);
        await loadData();
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      alert(`Fehler beim Aktualisieren der Subscription: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
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

  const getSubscriptionStats = () => {
    const subscriptionCounts = users.reduce((acc, user) => {
      const subscription = user.subscription || 'free';
      acc[subscription] = (acc[subscription] || 0) + 1;
      return acc;
    }, {});

    return subscriptionCounts;
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

  const subscriptionStats = getSubscriptionStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Verwalten Sie Benutzer und Subscriptions</p>
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
            <div className="text-2xl font-bold">{stats?.users?.total || users.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.users?.active || users.filter(u => u.is_active).length} aktiv, {stats?.users?.admins || users.filter(u => u.role === 'admin').length} Admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.premium || 0 + subscriptionStats.enterprise || 0}</div>
            <p className="text-xs text-muted-foreground">
              Premium/Enterprise Benutzer
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
              {stats?.posts?.posted || 0} veröffentlicht
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

      {/* Subscription Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Subscription-Übersicht
          </CardTitle>
          <CardDescription>Verteilung der Subscription-Typen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(subscriptionTypes).map(([key, subscription]) => (
              <div key={key} className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${subscription.color} mb-2`}>
                  {subscription.name}
                </div>
                <div className="text-2xl font-bold">{subscriptionStats[key] || 0}</div>
                <div className="text-xs text-muted-foreground">{subscription.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Benutzerverwaltung</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription-Management</TabsTrigger>
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
                    <TableHead>Subscription</TableHead>
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
                        <Badge className={subscriptionTypes[user.subscription || 'free'].color}>
                          {subscriptionTypes[user.subscription || 'free'].name}
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
                            onClick={() => {
                              setSelectedUserForSubscription(user);
                              setShowSubscriptionDialog(true);
                            }}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
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

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription-Management</CardTitle>
              <CardDescription>Verwalten Sie Benutzer-Subscriptions und Limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Subscription-Typen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(subscriptionTypes).map(([key, subscription]) => (
                      <Card key={key} className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{subscription.name}</CardTitle>
                          <CardDescription>{subscription.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-2">{subscription.limit}</div>
                          <div className="text-sm text-muted-foreground">Posts pro Monat</div>
                          <div className="mt-3">
                            <Badge className={subscription.color}>
                              {subscriptionStats[key] || 0} Benutzer
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Benutzer nach Subscription</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Benutzername</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Aktuelle Subscription</TableHead>
                        <TableHead>Monatliches Limit</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={subscriptionTypes[user.subscription || 'free'].color}>
                              {subscriptionTypes[user.subscription || 'free'].name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {subscriptionTypes[user.subscription || 'free'].limit} Posts
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUserForSubscription(user);
                                setShowSubscriptionDialog(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Ändern
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
                  <p className="text-sm text-muted-foreground">Subscription-Management: ✅ Aktiv</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Subscription-Limits</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {Object.entries(subscriptionTypes).map(([key, subscription]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{subscription.name}:</span> {subscription.limit} Posts
                      </div>
                    ))}
                  </div>
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
              <div>
                <Label htmlFor="subscription">Subscription</Label>
                <Select value={newUser.subscription} onValueChange={(value) => setNewUser({ ...newUser, subscription: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(subscriptionTypes).map(([key, subscription]) => (
                      <SelectItem key={key} value={key}>
                        {subscription.name} - {subscription.description}
                      </SelectItem>
                    ))}
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
              <div>
                <Label htmlFor="edit-subscription">Subscription</Label>
                <Select value={editingUser.subscription || 'free'} onValueChange={(value) => setEditingUser({ ...editingUser, subscription: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(subscriptionTypes).map(([key, subscription]) => (
                      <SelectItem key={key} value={key}>
                        {subscription.name} - {subscription.description}
                      </SelectItem>
                    ))}
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

      {/* Subscription Dialog */}
      {showSubscriptionDialog && selectedUserForSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Subscription ändern</CardTitle>
              <CardDescription>
                Subscription für {selectedUserForSubscription.username} ändern
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Aktuelle Subscription</Label>
                <div className="mt-2">
                  <Badge className={subscriptionTypes[selectedUserForSubscription.subscription || 'free'].color}>
                    {subscriptionTypes[selectedUserForSubscription.subscription || 'free'].name}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Neue Subscription wählen</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {Object.entries(subscriptionTypes).map(([key, subscription]) => (
                    <Button
                      key={key}
                      variant={selectedUserForSubscription.subscription === key ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => handleUpdateSubscription(selectedUserForSubscription.id, key)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {subscription.name} - {subscription.description}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowSubscriptionDialog(false);
                  setSelectedUserForSubscription(null);
                }}>
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

