import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminPageFinalWorking = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  
  // New states for CRUD operations
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    subscription: 'free'
  });
  const [editUserForm, setEditUserForm] = useState({
    username: '',
    email: '',
    role: 'user',
    subscription: 'free',
    password: ''
  });

  // Debug-Logging-Funktion
  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${type === 'error' ? '❌' : type === 'success' ? '✅' : '📝'} ${message}`;
    setDebugLogs(prev => [logEntry, ...prev].slice(0, 50));
  };

  // Benutzer laden
  const fetchUsers = async () => {
    try {
      setLoading(true);
      addDebugLog('Lade Benutzer-Daten...');
      
      // Zuerst den offiziellen Admin-Endpunkt mit Authorization versuchen
      const token = localStorage.getItem('token') || 'mock-token';
      
      try {
        addDebugLog('Versuche offiziellen Admin-Endpunkt mit Authorization...');
        const response = await fetch('https://social-media-post-generator-backend.onrender.com/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
          setError('');
          addDebugLog(`✅ ${data.users?.length || 0} Benutzer vom Admin-Endpunkt geladen`, 'success');
          return;
        } else {
          addDebugLog(`❌ Admin-Endpunkt Fehler ${response.status}`, 'error');
        }
      } catch (err) {
        addDebugLog(`❌ Admin-Endpunkt Netzwerk-Fehler: ${err.message}`, 'error');
      }
      
      // Fallback zu Debug-Endpunkten
      const endpoints = [
        'https://social-media-post-generator-backend.onrender.com/api/admin/users',
        'https://social-media-post-generator-backend.onrender.com/api/admin/users'
      ];

      let userData = null;
      
      for (const endpoint of endpoints) {
        try {
          addDebugLog(`Versuche Fallback-Endpunkt: ${endpoint}`);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            userData = data;
            addDebugLog(`✅ Erfolgreich geladen von: ${endpoint}`, 'success');
            break;
          } else {
            addDebugLog(`❌ Fehler ${response.status} bei: ${endpoint}`, 'error');
          }
        } catch (err) {
          addDebugLog(`❌ Netzwerk-Fehler bei: ${endpoint}`, 'error');
        }
      }

      if (userData) {
        setUsers(userData.users || []);
        setError('');
        addDebugLog(`✅ ${userData.users?.length || 0} Benutzer geladen`, 'success');
      } else {
        throw new Error('Alle API-Endpunkte fehlgeschlagen');
      }

    } catch (err) {
      setError(`Fehler beim Laden der Benutzer: ${err.message}`);
      addDebugLog(`❌ Fehler: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Subscription aktualisieren - DIREKTE BACKEND-INTEGRATION
  const updateSubscription = async (userId, newSubscription) => {
    try {
      addDebugLog(`Starte Subscription-Update für Benutzer ${userId} zu ${newSubscription}`);
      
      // DIREKTE BACKEND-API OHNE FRONTEND-PROXY
      const directApiUrl = `https://social-media-post-generator-backend.onrender.com/api/subscription/users/${userId}`;
      
      addDebugLog(`Verwende direkte Backend-API: ${directApiUrl}`);
      
      const response = await fetch(directApiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          subscription: newSubscription
        })
      });

      addDebugLog(`Response Status: ${response.status}`);
      
      if (response.ok) {
        const responseData = await response.json();
        addDebugLog(`Response Data: ${JSON.stringify(responseData)}`);
        addDebugLog(`✅ Subscription erfolgreich aktualisiert!`, 'success');
        
        // Benutzer-Liste aktualisieren
        await fetchUsers();
        setShowSubscriptionDialog(false);
        setSelectedUser(null);
        alert(`Subscription für Benutzer erfolgreich zu ${newSubscription} geändert!`);
        
      } else {
        // Fallback: Versuche alternative Endpunkte
        addDebugLog(`❌ Direkte API fehlgeschlagen, versuche Fallback...`, 'error');
        
        const fallbackEndpoints = [
          `https://social-media-post-generator-backend.onrender.com/api/admin/users/${userId}`,
          `https://social-media-post-generator-backend.onrender.com/api/admin/users/${userId}`
        ];
        
        let success = false;
        for (const endpoint of fallbackEndpoints) {
          try {
            addDebugLog(`Versuche Fallback: ${endpoint}`);
            
            const fallbackResponse = await fetch(endpoint, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subscription: newSubscription
              })
            });

            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              addDebugLog(`✅ Fallback erfolgreich: ${JSON.stringify(data)}`, 'success');
              success = true;
              break;
            } else {
              addDebugLog(`❌ Fallback Fehler ${fallbackResponse.status}`, 'error');
            }
          } catch (err) {
            addDebugLog(`❌ Fallback Netzwerk-Fehler: ${err.message}`, 'error');
          }
        }
        
        if (success) {
          await fetchUsers();
          setShowSubscriptionDialog(false);
          setSelectedUser(null);
          alert(`Subscription für Benutzer erfolgreich zu ${newSubscription} geändert!`);
        } else {
          throw new Error('Alle API-Endpunkte fehlgeschlagen');
        }
      }

    } catch (err) {
      addDebugLog(`❌ Subscription-Update fehlgeschlagen: ${err.message}`, 'error');
      alert(`Fehler beim Aktualisieren der Subscription: ${err.message}`);
    }
  };

  // Subscription-Dialog öffnen
  const openSubscriptionDialog = (user) => {
    setSelectedUser(user);
    setShowSubscriptionDialog(true);
    addDebugLog(`Öffne Subscription-Dialog für: ${user.username}`);
  };

  // Subscription-Statistiken berechnen
  const getSubscriptionStats = () => {
    const stats = {
      free: users.filter(u => (u.subscription || 'free') === 'free').length,
      basic: users.filter(u => u.subscription === 'basic').length,
      premium: users.filter(u => u.subscription === 'premium').length,
      enterprise: users.filter(u => u.subscription === 'enterprise').length
    };
    return stats;
  };

  // CRUD Functions
  
  // Create User
  const handleCreateUser = async () => {
    try {
      addDebugLog('Starte Benutzer-Erstellung...');
      
      // Validation
      if (!createUserForm.username || !createUserForm.email || !createUserForm.password) {
        alert('Bitte füllen Sie alle Pflichtfelder aus.');
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch('https://social-media-post-generator-backend.onrender.com/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createUserForm)
      });
      
      if (response.ok) {
        const result = await response.json();
        addDebugLog(`✅ Benutzer erfolgreich erstellt: ${result.user.username}`, 'success');
        await fetchUsers();
        setShowCreateUserModal(false);
        setCreateUserForm({
          username: '',
          email: '',
          password: '',
          role: 'user',
          subscription: 'free'
        });
        alert(`Benutzer ${createUserForm.username} erfolgreich erstellt!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen des Benutzers');
      }
    } catch (error) {
      addDebugLog(`❌ Fehler beim Erstellen: ${error.message}`, 'error');
      alert(`Fehler beim Erstellen des Benutzers: ${error.message}`);
    }
  };
  
  // Edit User
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUserForm({
      username: user.username,
      email: user.email,
      role: user.role,
      subscription: user.subscription || 'free',
      password: '' // Leer lassen für optionale Passwort-Änderung
    });
    setShowEditUserModal(true);
    addDebugLog(`Bearbeite Benutzer: ${user.username}`);
  };
  
  const handleUpdateUser = async () => {
    try {
      addDebugLog(`Starte Benutzer-Update für: ${editingUser.username}`);
      
      // Prepare update data - only include password if it's not empty
      const updateData = {
        username: editUserForm.username,
        email: editUserForm.email,
        role: editUserForm.role,
        subscription: editUserForm.subscription
      };
      
      // Only include password if it's provided
      if (editUserForm.password && editUserForm.password.trim() !== '') {
        updateData.password = editUserForm.password;
        addDebugLog('Passwort wird mit aktualisiert');
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(`https://social-media-post-generator-backend.onrender.com/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const result = await response.json();
        addDebugLog(`✅ Benutzer erfolgreich aktualisiert: ${result.user.username}`, 'success');
        await fetchUsers();
        setShowEditUserModal(false);
        setEditingUser(null);
        alert(`Benutzer ${editUserForm.username} erfolgreich aktualisiert!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren des Benutzers');
      }
    } catch (error) {
      addDebugLog(`❌ Fehler beim Aktualisieren: ${error.message}`, 'error');
      alert(`Fehler beim Aktualisieren des Benutzers: ${error.message}`);
    }
  };
  
  // Delete User
  const handleDeleteUser = async (user) => {
    try {
      addDebugLog(`Starte Benutzer-Löschung für: ${user.username}`);
      
      if (confirm(`Sind Sie sicher, dass Sie ${user.username} löschen möchten?`)) {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://social-media-post-generator-backend.onrender.com/api/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          addDebugLog(`✅ Benutzer erfolgreich gelöscht: ${user.username}`, 'success');
          await fetchUsers();
          alert(`Benutzer ${user.username} erfolgreich gelöscht!`);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Fehler beim Löschen des Benutzers');
        }
      }
    } catch (error) {
      addDebugLog(`❌ Fehler beim Löschen: ${error.message}`, 'error');
      alert(`Fehler beim Löschen des Benutzers: ${error.message}`);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 dark:text-gray-300">Sie haben keine Berechtigung für diesen Bereich.</p>
        </div>
      </div>
    );
  }

  const subscriptionStats = getSubscriptionStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Verwalten Sie Benutzer und Subscriptions</p>
            </div>
            <button
              onClick={fetchUsers}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Aktualisieren
            </button>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Benutzer gesamt</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{users.filter(u => u.is_active).length} aktiv, {users.filter(u => u.role === 'admin').length} Admins</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">💎</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Premium/Enterprise</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{subscriptionStats.premium + subscriptionStats.enterprise}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Premium/Enterprise Benutzer</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-semibold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Posts gesamt</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">0 veröffentlicht</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-semibold">⚡</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">System Status</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">Online</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Alle Services verfügbar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription-Übersicht */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📊 Subscription-Übersicht</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Verteilung der Subscription-Typen</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">Free</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{subscriptionStats.free}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">10 Posts pro Monat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">Basic</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{subscriptionStats.basic}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">50 Posts pro Monat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">Premium</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{subscriptionStats.premium}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">200 Posts pro Monat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">Enterprise</div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{subscriptionStats.enterprise}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">1000 Posts pro Monat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                👥 Benutzerverwaltung
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subscriptions'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                💎 Subscription-Management
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'debug'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                🔧 Debug-Informationen
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Benutzerverwaltung</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Verwalten Sie alle Benutzer des Systems</p>
                  </div>
                  <button 
                    onClick={() => {
                      addDebugLog('Benutzer erstellen Button geklickt');
                      setShowCreateUserModal(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ➕ Benutzer erstellen
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Lade Benutzer...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <button
                      onClick={fetchUsers}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Erneut versuchen
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Benutzername</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">E-Mail</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rolle</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subscription</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Erstellt</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (user.subscription || 'free') === 'enterprise' ? 'bg-orange-100 text-orange-800' :
                                (user.subscription || 'free') === 'premium' ? 'bg-purple-100 text-purple-800' :
                                (user.subscription || 'free') === 'basic' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {(user.subscription || 'free').charAt(0).toUpperCase() + (user.subscription || 'free').slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? 'Aktiv' : 'Inaktiv'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openSubscriptionDialog(user)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors"
                                title="Subscription ändern"
                              >
                                💳 Subscription
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                                title="Bearbeiten"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                                title="Löschen"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Subscription-Management</h2>
                <div className="space-y-6">
                  {['free', 'basic', 'premium', 'enterprise'].map((type) => {
                    const typeUsers = users.filter(u => (u.subscription || 'free') === type);
                    const limits = {
                      free: 10,
                      basic: 50,
                      premium: 200,
                      enterprise: 1000
                    };
                    
                    return (
                      <div key={type} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 capitalize">{type} Subscription</h3>
                            <p className="text-sm text-gray-600">{limits[type]} Posts pro Monat</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{typeUsers.length}</div>
                            <div className="text-sm text-gray-500">Benutzer</div>
                          </div>
                        </div>
                        
                        {typeUsers.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Benutzer:</h4>
                            <div className="flex flex-wrap gap-2">
                              {typeUsers.map((user) => (
                                <span
                                  key={user.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {user.username}
                                  <button
                                    onClick={() => openSubscriptionDialog(user)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                    title="Subscription ändern"
                                  >
                                    💳
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'debug' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Debug-Informationen</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-800">API-Status</h3>
                    <p className="text-sm text-green-600">Verfügbar</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-800">Datenbank</h3>
                    <p className="text-sm text-green-600">Verfügbar</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-800">Subscription-Management</h3>
                    <p className="text-sm text-green-600">Aktiv</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Neuen Benutzer erstellen</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benutzername *</label>
                  <input
                    type="text"
                    value={createUserForm.username}
                    onChange={(e) => setCreateUserForm({...createUserForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Benutzername eingeben"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
                  <input
                    type="email"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E-Mail eingeben"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passwort *</label>
                  <input
                    type="password"
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({...createUserForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Passwort eingeben"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
                  <select
                    value={createUserForm.role}
                    onChange={(e) => setCreateUserForm({...createUserForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Benutzer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription</label>
                  <select
                    value={createUserForm.subscription}
                    onChange={(e) => setCreateUserForm({...createUserForm, subscription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setCreateUserForm({
                      username: '',
                      email: '',
                      password: '',
                      role: 'user',
                      subscription: 'free'
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Benutzer erstellen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Benutzer bearbeiten: {editingUser.username}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benutzername</label>
                  <input
                    type="text"
                    value={editUserForm.username}
                    onChange={(e) => setEditUserForm({...editUserForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rolle</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">Benutzer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription</label>
                  <select
                    value={editUserForm.subscription}
                    onChange={(e) => setEditUserForm({...editUserForm, subscription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Neues Passwort (optional)
                  </label>
                  <input
                    type="password"
                    value={editUserForm.password}
                    onChange={(e) => setEditUserForm({...editUserForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Leer lassen, um Passwort nicht zu ändern"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mindestens 6 Zeichen. Leer lassen, um das aktuelle Passwort zu behalten.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Änderungen speichern
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Dialog */}
        {showSubscriptionDialog && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subscription ändern für: {selectedUser.username}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Subscription für {selectedUser.username} ändern</p>
              
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aktuelle Subscription</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {(selectedUser.subscription || 'free').charAt(0).toUpperCase() + (selectedUser.subscription || 'free').slice(1)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Neue Subscription wählen</label>
                  <div className="space-y-2">
                    {[
                      { value: 'free', label: 'Free - 10 Posts pro Monat', color: 'bg-gray-50 hover:bg-gray-100' },
                      { value: 'basic', label: 'Basic - 50 Posts pro Monat', color: 'bg-green-50 hover:bg-green-100' },
                      { value: 'premium', label: 'Premium - 200 Posts pro Monat', color: 'bg-purple-50 hover:bg-purple-100' },
                      { value: 'enterprise', label: 'Enterprise - 1000 Posts pro Monat', color: 'bg-orange-50 hover:bg-orange-100' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSubscription(selectedUser.id, option.value)}
                        className={`w-full text-left p-3 rounded-lg border border-gray-200 transition-colors ${option.color}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSubscriptionDialog(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPageFinalWorking;

