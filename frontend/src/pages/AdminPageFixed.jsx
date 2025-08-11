import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, CreditCard, FileText, Settings, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://social-media-post-generator-backend.onrender.com';

const AdminPageFixed = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [selectedUserForSubscription, setSelectedUserForSubscription] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    subscription: 'free'
  });

  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const addDebugInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `${timestamp}: ${message}\n${prev}`);
  };

  const loadData = async () => {
    setLoading(true);
    addDebugInfo('🔄 Lade Daten...');
    
    try {
      // Try multiple endpoints for users
      const userEndpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-users`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-users`,
        `${API_BASE_URL}/api/admin/users`
      ];
      
      let usersData = [];
      let usersResponse = null;
      
      for (const endpoint of userEndpoints) {
        try {
          addDebugInfo(`🔍 Versuche Endpunkt: ${endpoint}`);
          usersResponse = await fetch(endpoint, {
            headers: getAuthHeaders()
          });
          
          if (usersResponse.ok) {
            const data = await usersResponse.json();
            usersData = data.users || data.data || [];
            addDebugInfo(`✅ Erfolgreich ${usersData.length} Benutzer geladen von ${endpoint}`);
            break;
          } else {
            addDebugInfo(`❌ Fehler ${usersResponse.status} von ${endpoint}`);
          }
        } catch (e) {
          addDebugInfo(`❌ Netzwerkfehler bei ${endpoint}: ${e.message}`);
          continue;
        }
      }
      
      setUsers(usersData);

      // Try multiple endpoints for stats
      const statsEndpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-stats`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-stats`,
        `${API_BASE_URL}/api/admin/stats`
      ];
      
      let statsData = {};
      
      for (const endpoint of statsEndpoints) {
        try {
          const statsResponse = await fetch(endpoint, {
            headers: getAuthHeaders()
          });
          
          if (statsResponse.ok) {
            statsData = await statsResponse.json();
            addDebugInfo(`✅ Statistiken geladen von ${endpoint}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      setStats(statsData);

      // Try multiple endpoints for posts
      const postsEndpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-posts`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-posts`,
        `${API_BASE_URL}/api/admin/posts`
      ];
      
      let postsData = [];
      
      for (const endpoint of postsEndpoints) {
        try {
          const postsResponse = await fetch(endpoint, {
            headers: getAuthHeaders()
          });
          
          if (postsResponse.ok) {
            const data = await postsResponse.json();
            postsData = data.posts || data.data || [];
            addDebugInfo(`✅ ${postsData.length} Posts geladen von ${endpoint}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      setPosts(postsData);
      
    } catch (error) {
      addDebugInfo(`❌ Allgemeiner Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user, token]);

  const handleCreateUser = async () => {
    try {
      addDebugInfo(`🔄 Erstelle Benutzer: ${newUser.username}`);
      
      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-users`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-users`,
        `${API_BASE_URL}/api/admin/users`
      ];
      
      let response = null;
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          addDebugInfo(`🔍 Versuche Benutzer-Erstellung bei: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newUser)
          });
          
          if (response.ok) {
            success = true;
            addDebugInfo(`✅ Benutzer erfolgreich erstellt bei ${endpoint}`);
            break;
          } else {
            const errorData = await response.json();
            addDebugInfo(`❌ Fehler ${response.status} bei ${endpoint}: ${errorData.error || 'Unbekannt'}`);
          }
        } catch (e) {
          addDebugInfo(`❌ Netzwerkfehler bei ${endpoint}: ${e.message}`);
          continue;
        }
      }
      
      if (success) {
        setNewUser({ username: '', email: '', password: '', role: 'user', subscription: 'free' });
        setShowCreateUser(false);
        await loadData();
        addDebugInfo(`🎉 Benutzer ${newUser.username} erfolgreich erstellt!`);
      } else {
        const errorData = response ? await response.json() : { error: 'Alle Endpunkte fehlgeschlagen' };
        addDebugInfo(`❌ Benutzer-Erstellung fehlgeschlagen: ${errorData.error}`);
        alert(`Fehler beim Erstellen des Benutzers: ${errorData.error}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Unerwarteter Fehler bei Benutzer-Erstellung: ${error.message}`);
      alert(`Fehler beim Erstellen des Benutzers: ${error.message}`);
    }
  };

  const handleUpdateSubscription = async (userId, newSubscription) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        addDebugInfo(`❌ Benutzer mit ID ${userId} nicht gefunden`);
        return;
      }

      addDebugInfo(`🔄 Aktualisiere Subscription für ${userToUpdate.username} zu ${newSubscription}`);

      const updatedUser = { 
        ...userToUpdate, 
        subscription: newSubscription,
        username: userToUpdate.username,
        email: userToUpdate.email,
        role: userToUpdate.role,
        is_active: userToUpdate.is_active
      };

      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-users/${userId}`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-users/${userId}`,
        `${API_BASE_URL}/api/admin/users/${userId}`
      ];
      
      let response = null;
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          addDebugInfo(`🔍 Versuche Subscription-Update bei: ${endpoint}`);
          addDebugInfo(`📤 Sende Daten: ${JSON.stringify(updatedUser)}`);
          
          response = await fetch(endpoint, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedUser)
          });
          
          addDebugInfo(`📥 Response Status: ${response.status}`);
          
          if (response.ok) {
            const responseData = await response.json();
            addDebugInfo(`📥 Response Data: ${JSON.stringify(responseData)}`);
            
            // Check if subscription was actually updated
            if (responseData.user && responseData.user.subscription === newSubscription) {
              success = true;
              addDebugInfo(`✅ Subscription erfolgreich aktualisiert bei ${endpoint}`);
              break;
            } else {
              addDebugInfo(`⚠️ Subscription nicht aktualisiert bei ${endpoint}. Erwartet: ${newSubscription}, Erhalten: ${responseData.user?.subscription}`);
            }
          } else {
            const errorData = await response.json();
            addDebugInfo(`❌ Fehler ${response.status} bei ${endpoint}: ${errorData.error || 'Unbekannt'}`);
          }
        } catch (e) {
          addDebugInfo(`❌ Netzwerkfehler bei ${endpoint}: ${e.message}`);
          continue;
        }
      }
      
      if (success) {
        setShowSubscriptionDialog(false);
        setSelectedUserForSubscription(null);
        await loadData();
        addDebugInfo(`🎉 Subscription für ${userToUpdate.username} erfolgreich zu ${newSubscription} geändert!`);
      } else {
        const errorData = response ? await response.json() : { error: 'Alle Endpunkte fehlgeschlagen' };
        addDebugInfo(`❌ Subscription-Update fehlgeschlagen: ${errorData.error}`);
        alert(`Fehler beim Aktualisieren der Subscription: ${errorData.error}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Unerwarteter Fehler bei Subscription-Update: ${error.message}`);
      alert(`Fehler beim Aktualisieren der Subscription: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      addDebugInfo(`🔄 Lösche Benutzer mit ID: ${userId}`);
      
      const endpoints = [
        `${API_BASE_URL}/api/debug-admin/debug-users/${userId}`,
        `${API_BASE_URL}/api/debug-admin-safe/debug-users/${userId}`,
        `${API_BASE_URL}/api/admin/users/${userId}`
      ];
      
      let response = null;
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          addDebugInfo(`🔍 Versuche Benutzer-Löschung bei: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          
          if (response.ok) {
            success = true;
            addDebugInfo(`✅ Benutzer erfolgreich gelöscht bei ${endpoint}`);
            break;
          } else {
            const errorData = await response.json();
            addDebugInfo(`❌ Fehler ${response.status} bei ${endpoint}: ${errorData.error || 'Unbekannt'}`);
          }
        } catch (e) {
          addDebugInfo(`❌ Netzwerkfehler bei ${endpoint}: ${e.message}`);
          continue;
        }
      }
      
      if (success) {
        setDeleteUserId(null);
        await loadData();
        addDebugInfo(`🎉 Benutzer erfolgreich gelöscht!`);
      } else {
        const errorData = response ? await response.json() : { error: 'Alle Endpunkte fehlgeschlagen' };
        addDebugInfo(`❌ Benutzer-Löschung fehlgeschlagen: ${errorData.error}`);
        alert(`Fehler beim Löschen des Benutzers: ${errorData.error}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Unerwarteter Fehler bei Benutzer-Löschung: ${error.message}`);
      alert(`Fehler beim Löschen des Benutzers: ${error.message}`);
    }
  };

  const getSubscriptionBadgeColor = (subscription) => {
    switch (subscription) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionLimits = (subscription) => {
    switch (subscription) {
      case 'free': return 10;
      case 'basic': return 50;
      case 'premium': return 200;
      case 'enterprise': return 1000;
      default: return 10;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">Zugriff verweigert. Nur Administratoren können diese Seite aufrufen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <p>Lade Admin Dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subscriptionStats = users.reduce((acc, user) => {
    acc[user.subscription || 'free'] = (acc[user.subscription || 'free'] || 0) + 1;
    return acc;
  }, { free: 0, basic: 0, premium: 0, enterprise: 0 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Verwalten Sie Benutzer und Subscriptions</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Benutzer gesamt</p>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-gray-500">
                  {users.filter(u => u.is_active).length} aktiv, {users.filter(u => u.role === 'admin').length} Admins
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subscriptions</p>
                <p className="text-2xl font-bold">{subscriptionStats.premium + subscriptionStats.enterprise}</p>
                <p className="text-xs text-gray-500">Premium/Enterprise Benutzer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Posts gesamt</p>
                <p className="text-2xl font-bold">{posts.length}</p>
                <p className="text-xs text-gray-500">{posts.filter(p => p.status === 'posted').length} veröffentlicht</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
                <p className="text-xs text-gray-500">Alle Services verfügbar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Subscription-Übersicht
          </CardTitle>
          <p className="text-sm text-gray-600">Verteilung der Subscription-Typen</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Free</p>
              <p className="text-3xl font-bold">{subscriptionStats.free}</p>
              <p className="text-xs text-gray-500">10 Posts pro Monat</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-blue-600">Basic</p>
              <p className="text-3xl font-bold text-blue-600">{subscriptionStats.basic}</p>
              <p className="text-xs text-gray-500">50 Posts pro Monat</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-purple-600">Premium</p>
              <p className="text-3xl font-bold text-purple-600">{subscriptionStats.premium}</p>
              <p className="text-xs text-gray-500">200 Posts pro Monat</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-yellow-600">Enterprise</p>
              <p className="text-3xl font-bold text-yellow-600">{subscriptionStats.enterprise}</p>
              <p className="text-xs text-gray-500">1000 Posts pro Monat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Benutzerverwaltung</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription-Management</TabsTrigger>
          <TabsTrigger value="posts">Post-Übersicht</TabsTrigger>
          <TabsTrigger value="debug">Debug-Informationen</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Benutzerverwaltung</CardTitle>
                  <p className="text-sm text-gray-600">Verwalten Sie alle Benutzer des Systems</p>
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
                        <Badge className={getSubscriptionBadgeColor(user.subscription || 'free')}>
                          {(user.subscription || 'free').charAt(0).toUpperCase() + (user.subscription || 'free').slice(1)}
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
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUserForSubscription(user);
                              setShowSubscriptionDialog(true);
                            }}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteUserId(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription-Management</CardTitle>
              <p className="text-sm text-gray-600">Verwalten Sie Benutzer-Subscriptions und Limits</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Subscription-Typen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold">Free</h4>
                        <p className="text-2xl font-bold">{getSubscriptionLimits('free')} Posts pro Monat</p>
                        <p className="text-sm text-gray-600">{subscriptionStats.free} Benutzer</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-blue-600">Basic</h4>
                        <p className="text-2xl font-bold">{getSubscriptionLimits('basic')} Posts pro Monat</p>
                        <p className="text-sm text-gray-600">{subscriptionStats.basic} Benutzer</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-purple-600">Premium</h4>
                        <p className="text-2xl font-bold">{getSubscriptionLimits('premium')} Posts pro Monat</p>
                        <p className="text-sm text-gray-600">{subscriptionStats.premium} Benutzer</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-yellow-600">Enterprise</h4>
                        <p className="text-2xl font-bold">{getSubscriptionLimits('enterprise')} Posts pro Monat</p>
                        <p className="text-sm text-gray-600">{subscriptionStats.enterprise} Benutzer</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Benutzer nach Subscription</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Benutzer</TableHead>
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
                            <Badge className={getSubscriptionBadgeColor(user.subscription || 'free')}>
                              {(user.subscription || 'free').charAt(0).toUpperCase() + (user.subscription || 'free').slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{getSubscriptionLimits(user.subscription || 'free')} Posts</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserForSubscription(user);
                                setShowSubscriptionDialog(true);
                              }}
                            >
                              Subscription ändern
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

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Post-Übersicht</CardTitle>
              <p className="text-sm text-gray-600">Alle Posts aller Benutzer</p>
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

        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug-Informationen</CardTitle>
              <p className="text-sm text-gray-600">API-Aufrufe und Fehlermeldungen</p>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {debugInfo || 'Keine Debug-Informationen verfügbar.'}
                </pre>
              </div>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => setDebugInfo('')}
              >
                Debug-Log löschen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      {showCreateUser && (
        <AlertDialog open={showCreateUser} onOpenChange={setShowCreateUser}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Neuen Benutzer erstellen</AlertDialogTitle>
              <AlertDialogDescription>
                Geben Sie die Daten für den neuen Benutzer ein.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Benutzername</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Benutzername eingeben"
                />
              </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="E-Mail eingeben"
                />
              </div>
              <div>
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Passwort eingeben"
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
                    <SelectItem value="free">Free - 10 Posts pro Monat</SelectItem>
                    <SelectItem value="basic">Basic - 50 Posts pro Monat</SelectItem>
                    <SelectItem value="premium">Premium - 200 Posts pro Monat</SelectItem>
                    <SelectItem value="enterprise">Enterprise - 1000 Posts pro Monat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateUser}>Erstellen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Subscription Dialog */}
      {showSubscriptionDialog && selectedUserForSubscription && (
        <AlertDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Subscription ändern</AlertDialogTitle>
              <AlertDialogDescription>
                Subscription für {selectedUserForSubscription.username} ändern
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Aktuelle Subscription</Label>
                <div className="p-2 bg-gray-100 rounded">
                  <Badge className={getSubscriptionBadgeColor(selectedUserForSubscription.subscription || 'free')}>
                    {(selectedUserForSubscription.subscription || 'free').charAt(0).toUpperCase() + (selectedUserForSubscription.subscription || 'free').slice(1)}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Neue Subscription wählen</Label>
                <div className="space-y-2 mt-2">
                  {['free', 'basic', 'premium', 'enterprise'].map((subscription) => (
                    <Button
                      key={subscription}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleUpdateSubscription(selectedUserForSubscription.id, subscription)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {subscription.charAt(0).toUpperCase() + subscription.slice(1)} - {getSubscriptionLimits(subscription)} Posts pro Monat
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete User Dialog */}
      {deleteUserId && (
        <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Benutzer löschen</AlertDialogTitle>
              <AlertDialogDescription>
                Sind Sie sicher, dass Sie diesen Benutzer löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteUser(deleteUserId)}>
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default AdminPageFixed;

