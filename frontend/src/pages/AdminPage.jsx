import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Users, FileText, Share2, BarChart3, Plus, Edit, Trash2, Crown, User, CheckCircle, XCircle, Calendar, TrendingUp, Settings, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const AdminPage = () => {
  const { token } = useAuth()
  const API_BASE_URL = import.meta.env.VITE_API_URL || ''
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    subscription: 'free',
    monthly_limit: 10
  })
  const [subscriptionUpdate, setSubscriptionUpdate] = useState({
    subscription: 'free',
    monthly_limit: 10,
    reset_usage: false
  })

  // Subscription limits mapping
  const subscriptionLimits = {
    free: 10,
    basic: 50,
    premium: 200,
    enterprise: 1000
  }

  // Fetch system statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug-admin/debug-stats`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Fehler beim Laden der Statistiken')
      }
    } catch (error) {
      setError('Fehler beim Laden der Statistiken')
    }
  }

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug-admin/debug-users`)
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        setError('Fehler beim Laden der Benutzer')
      }
    } catch (error) {
      setError('Fehler beim Laden der Benutzer')
    }
  }

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug-admin/debug-posts`)
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      } else {
        setError('Fehler beim Laden der Posts')
      }
    } catch (error) {
      setError('Fehler beim Laden der Posts')
    }
  }

  // Create new user
  const createUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug-admin/debug-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })
      
      if (response.ok) {
        setIsCreateUserOpen(false)
        setNewUser({ username: '', email: '', password: '', role: 'user', subscription: 'free', monthly_limit: 10 })
        fetchUsers()
        fetchStats()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Erstellen des Benutzers')
      }
    } catch (error) {
      setError('Fehler beim Erstellen des Benutzers')
    }
  }

  // Update user
  const updateUser = async (userId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug-admin/debug-users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        setIsEditUserOpen(false)
        fetchUsers()
        fetchStats()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Aktualisieren des Benutzers')
      }
    } catch (error) {
      setError('Fehler beim Aktualisieren des Benutzers')
    }
  }

  // Update user subscription
  const updateUserSubscription = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug-admin/debug-users/${userId}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionUpdate)
      })
      
      if (response.ok) {
        setIsSubscriptionDialogOpen(false)
        setSubscriptionUpdate({ subscription: 'free', monthly_limit: 10, reset_usage: false })
        fetchUsers()
        fetchStats()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Aktualisieren der Subscription')
      }
    } catch (error) {
      setError('Fehler beim Aktualisieren der Subscription')
    }
  }

  // Delete user
  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug-admin/debug-users/${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchUsers()
        fetchStats()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Löschen des Benutzers')
      }
    } catch (error) {
      setError('Fehler beim Löschen des Benutzers')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchUsers(), fetchPosts()])
      setLoading(false)
    }
    
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie Benutzer und System-Einstellungen</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Neu laden
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <Button 
            onClick={() => setError(null)} 
            variant="ghost" 
            size="sm" 
            className="mt-2"
          >
            Schließen
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Benutzer gesamt</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.users?.active || 0} aktiv, {stats.users?.admins || 0} Admins
              </p>
              {stats.users?.by_subscription && (
                <div className="mt-2 space-y-1">
                  {Object.entries(stats.users.by_subscription).map(([sub, count]) => (
                    <div key={sub} className="flex justify-between text-xs">
                      <span className="capitalize">{sub}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posts gesamt</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.posts?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.posts?.posted || 0} veröffentlicht, {stats.posts?.draft || 0} Entwürfe
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Social Accounts</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.social_accounts?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.social_accounts?.active || 0} aktiv
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plattformen</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stats.social_accounts?.by_platform && Object.entries(stats.social_accounts.by_platform).map(([platform, count]) => (
                  <div key={platform} className="flex justify-between text-xs">
                    <span className="capitalize">{platform}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Benutzerverwaltung</TabsTrigger>
          <TabsTrigger value="posts">Post-Übersicht</TabsTrigger>
          <TabsTrigger value="system">System-Einstellungen</TabsTrigger>
        </TabsList>

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Benutzerverwaltung</h2>
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Benutzer erstellen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie einen neuen Benutzer für das System.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Benutzername
                    </Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      E-Mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Passwort
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Rolle
                    </Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Benutzer</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subscription" className="text-right">
                      Subscription
                    </Label>
                    <Select value={newUser.subscription} onValueChange={(value) => {
                      setNewUser({...newUser, subscription: value, monthly_limit: subscriptionLimits[value]})
                    }}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free (10 Posts/Monat)</SelectItem>
                        <SelectItem value="basic">Basic (50 Posts/Monat)</SelectItem>
                        <SelectItem value="premium">Premium (200 Posts/Monat)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (1000 Posts/Monat)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="monthly_limit" className="text-right">
                      Monatliches Limit
                    </Label>
                    <Input
                      id="monthly_limit"
                      type="number"
                      value={newUser.monthly_limit}
                      onChange={(e) => setNewUser({...newUser, monthly_limit: parseInt(e.target.value) || 10})}
                      className="col-span-3"
                      min="1"
                      max="10000"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createUser}>Benutzer erstellen</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Posts Nutzung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {user.role === 'admin' ? (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <User className="h-4 w-4 text-gray-400" />
                          )}
                          <span>{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          user.subscription === 'enterprise' ? 'default' :
                          user.subscription === 'premium' ? 'secondary' :
                          user.subscription === 'basic' ? 'outline' : 'destructive'
                        }>
                          {user.subscription?.charAt(0).toUpperCase() + user.subscription?.slice(1) || 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">
                            {user.post_usage ? 
                              `${user.post_usage.posts_generated}/${user.post_usage.monthly_limit}` : 
                              '0/10'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {user.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {user.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(user.created_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setSubscriptionUpdate({
                                subscription: user.subscription || 'free',
                                monthly_limit: user.post_usage?.monthly_limit || 10,
                                reset_usage: false
                              })
                              setIsSubscriptionDialogOpen(true)
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditUserOpen(true)
                            }}
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
                                <AlertDialogAction onClick={() => deleteUser(user.id)}>
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

        {/* Posts Overview Tab */}
        <TabsContent value="posts" className="space-y-4">
          <h2 className="text-xl font-semibold">Post-Übersicht</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Hier werden alle Posts aller Benutzer angezeigt.</p>
              <p className="text-sm text-gray-500 mt-2">
                Anzahl Posts: {posts.length}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-4">
          <h2 className="text-xl font-semibold">System-Einstellungen</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Hier können Sie System-weite Einstellungen verwalten.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium">Subscription-Limits</h3>
                  <div className="mt-2 space-y-2">
                    {Object.entries(subscriptionLimits).map(([sub, limit]) => (
                      <div key={sub} className="flex justify-between text-sm">
                        <span className="capitalize">{sub}:</span>
                        <span>{limit} Posts/Monat</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscription Management Dialog */}
      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscription verwalten</DialogTitle>
            <DialogDescription>
              Verwalten Sie die Subscription und monatlichen Limits für {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sub-subscription" className="text-right">
                Subscription
              </Label>
              <Select 
                value={subscriptionUpdate.subscription} 
                onValueChange={(value) => setSubscriptionUpdate({
                  ...subscriptionUpdate, 
                  subscription: value, 
                  monthly_limit: subscriptionLimits[value]
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (10 Posts/Monat)</SelectItem>
                  <SelectItem value="basic">Basic (50 Posts/Monat)</SelectItem>
                  <SelectItem value="premium">Premium (200 Posts/Monat)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1000 Posts/Monat)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sub-monthly-limit" className="text-right">
                Monatliches Limit
              </Label>
              <Input
                id="sub-monthly-limit"
                type="number"
                value={subscriptionUpdate.monthly_limit}
                onChange={(e) => setSubscriptionUpdate({
                  ...subscriptionUpdate, 
                  monthly_limit: parseInt(e.target.value) || 10
                })}
                className="col-span-3"
                min="1"
                max="10000"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reset-usage" className="text-right">
                Nutzung zurücksetzen
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  id="reset-usage"
                  type="checkbox"
                  checked={subscriptionUpdate.reset_usage}
                  onChange={(e) => setSubscriptionUpdate({
                    ...subscriptionUpdate, 
                    reset_usage: e.target.checked
                  })}
                />
                <Label htmlFor="reset-usage" className="text-sm">
                  Monatliche Nutzung auf 0 zurücksetzen
                </Label>
              </div>
            </div>
            {selectedUser?.post_usage && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Aktuelle Nutzung</Label>
                <div className="col-span-3 text-sm text-gray-600">
                  {selectedUser.post_usage.posts_generated}/{selectedUser.post_usage.monthly_limit} Posts generiert
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => updateUserSubscription(selectedUser?.id)}>
              Subscription aktualisieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Benutzer bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeiten Sie die Informationen für {selectedUser.username}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-username" className="text-right">
                  Benutzername
                </Label>
                <Input
                  id="edit-username"
                  defaultValue={selectedUser.username}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  E-Mail
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={selectedUser.email}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Rolle
                </Label>
                <Select defaultValue={selectedUser.role}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Benutzer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                const username = document.getElementById('edit-username').value
                const email = document.getElementById('edit-email').value
                const role = document.querySelector('[data-state="checked"]')?.textContent?.toLowerCase() || selectedUser.role
                
                updateUser(selectedUser.id, { username, email, role })
              }}>
                Änderungen speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default AdminPage

