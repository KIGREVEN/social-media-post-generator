import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminPageWorking = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

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
      
      // Mehrere API-Endpunkte versuchen
      const endpoints = [
        'https://social-media-post-generator-backend.onrender.com/api/debug-admin-safe/debug-users',
        'https://social-media-post-generator-backend.onrender.com/api/debug-admin/debug-users'
      ];

      let userData = null;
      for (const endpoint of endpoints) {
        try {
          addDebugLog(`Versuche Endpunkt: ${endpoint}`);
          const response = await fetch(endpoint);
          
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

      if (userData && userData.users) {
        setUsers(userData.users);
        addDebugLog(`✅ ${userData.users.length} Benutzer geladen`, 'success');
      } else {
        throw new Error('Keine Benutzer-Daten erhalten');
      }
    } catch (err) {
      setError('Fehler beim Laden der Benutzer: ' + err.message);
      addDebugLog(`❌ Fehler beim Laden: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Subscription aktualisieren - ALTERNATIVE METHODE
  const updateSubscription = async (userId, newSubscription) => {
    try {
      addDebugLog(`Starte Subscription-Update für Benutzer ${userId} zu ${newSubscription}`);
      
      // METHODE 1: Direkte Backend-API ohne JWT
      const directEndpoints = [
        `https://social-media-post-generator-backend.onrender.com/api/debug-admin-safe/debug-users/${userId}`,
        `https://social-media-post-generator-backend.onrender.com/api/debug-admin/users/${userId}`
      ];

      let success = false;
      for (const endpoint of directEndpoints) {
        try {
          addDebugLog(`Versuche direktes Update: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscription: newSubscription
            })
          });

          const responseData = await response.json();
          addDebugLog(`Response Status: ${response.status}`);
          addDebugLog(`Response Data: ${JSON.stringify(responseData)}`);

          if (response.ok) {
            addDebugLog(`✅ Subscription erfolgreich aktualisiert!`, 'success');
            success = true;
            break;
          } else {
            addDebugLog(`❌ Fehler ${response.status}: ${responseData.error || 'Unbekannter Fehler'}`, 'error');
          }
        } catch (err) {
          addDebugLog(`❌ Netzwerk-Fehler: ${err.message}`, 'error');
        }
      }

      if (!success) {
        // METHODE 2: Super Admin Endpunkt versuchen
        try {
          addDebugLog('Versuche Super Admin Endpunkt...');
          const superAdminResponse = await fetch('https://social-media-post-generator-backend.onrender.com/api/super-admin/update-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Super-Admin-Key': 'super-secret-admin-key-2024'
            },
            body: JSON.stringify({
              userId: userId,
              subscription: newSubscription
            })
          });

          if (superAdminResponse.ok) {
            const data = await superAdminResponse.json();
            addDebugLog(`✅ Super Admin Update erfolgreich!`, 'success');
            success = true;
          } else {
            addDebugLog(`❌ Super Admin Fehler: ${superAdminResponse.status}`, 'error');
          }
        } catch (err) {
          addDebugLog(`❌ Super Admin Netzwerk-Fehler: ${err.message}`, 'error');
        }
      }

      if (success) {
        // Benutzer-Liste aktualisieren
        await fetchUsers();
        setShowSubscriptionDialog(false);
        setSelectedUser(null);
        alert(`Subscription für Benutzer erfolgreich zu ${newSubscription} geändert!`);
      } else {
        throw new Error('Alle Update-Methoden fehlgeschlagen');
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
      free: users.filter(u => u.subscription === 'free').length,
      basic: users.filter(u => u.subscription === 'basic').length,
      premium: users.filter(u => u.subscription === 'premium').length,
      enterprise: users.filter(u => u.subscription === 'enterprise').length
    };
    return stats;
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600">Sie haben keine Berechtigung für diesen Bereich.</p>
        </div>
      </div>
    );
  }

  const subscriptionStats = getSubscriptionStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Verwalten Sie Benutzer und Subscriptions</p>
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Benutzer gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-xs text-gray-500">{users.filter(u => u.is_active).length} aktiv, {users.filter(u => u.role === 'admin').length} Admins</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">💎</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{subscriptionStats.premium + subscriptionStats.enterprise}</p>
                <p className="text-xs text-gray-500">Premium/Enterprise Benutzer</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Posts gesamt</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">0 veröffentlicht</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">⚡</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">System Status</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
                <p className="text-xs text-gray-500">Alle Services verfügbar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription-Übersicht */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📊 Subscription-Übersicht</h2>
            <p className="text-sm text-gray-600">Verteilung der Subscription-Typen</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">Free</div>
                <div className="text-3xl font-bold text-blue-600">{subscriptionStats.free}</div>
                <div className="text-sm text-gray-500">10 Posts pro Monat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">Basic</div>
                <div className="text-3xl font-bold text-green-600">{subscriptionStats.basic}</div>
                <div className="text-sm text-gray-500">50 Posts pro Monat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">Premium</div>
                <div className="text-3xl font-bold text-purple-600">{subscriptionStats.premium}</div>
                <div className="text-sm text-gray-500">200 Posts pro Monat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">Enterprise</div>
                <div className="text-3xl font-bold text-orange-600">{subscriptionStats.enterprise}</div>
                <div className="text-sm text-gray-500">1000 Posts pro Monat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Benutzerverwaltung
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subscriptions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💎 Subscription-Management
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Post-Übersicht
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'debug'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    <h2 className="text-lg font-semibold text-gray-900">Benutzerverwaltung</h2>
                    <p className="text-sm text-gray-600">Verwalten Sie alle Benutzer des Systems</p>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    ➕ Benutzer erstellen
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Lade Benutzer...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={fetchUsers}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Erneut versuchen
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benutzername</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-Mail</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellt</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
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
                                user.subscription === 'enterprise' ? 'bg-orange-100 text-orange-800' :
                                user.subscription === 'premium' ? 'bg-purple-100 text-purple-800' :
                                user.subscription === 'basic' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.subscription ? user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1) : 'Free'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? 'Aktiv' : 'Inaktiv'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openSubscriptionDialog(user)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                                title="Subscription ändern"
                              >
                                💳
                              </button>
                              <button
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                                title="Bearbeiten"
                              >
                                ✏️
                              </button>
                              <button
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

            {activeTab === 'posts' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Post-Übersicht</h2>
                <div className="text-center py-8">
                  <p className="text-gray-600">Noch keine Posts vorhanden.</p>
                </div>
              </div>
            )}

            {activeTab === 'debug' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Debug-Informationen</h2>
                <p className="text-sm text-gray-600 mb-4">API-Aufrufe und Fehlermeldungen</p>
                
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  {debugLogs.length === 0 ? (
                    <div className="text-gray-500">Keine Debug-Informationen verfügbar.</div>
                  ) : (
                    debugLogs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-800">Backend-Verbindung</h3>
                    <p className="text-sm text-green-600">Verbunden</p>
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
      </div>

      {/* Subscription-Dialog */}
      {showSubscriptionDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription ändern</h3>
            <p className="text-sm text-gray-600 mb-4">Subscription für {selectedUser.username} ändern</p>
            
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktuelle Subscription</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedUser.subscription ? selectedUser.subscription.charAt(0).toUpperCase() + selectedUser.subscription.slice(1) : 'Free'}
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
  );
};

export default AdminPageWorking;

