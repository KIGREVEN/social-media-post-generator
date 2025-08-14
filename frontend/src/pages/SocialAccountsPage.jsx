import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Link2, 
  Unlink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Share2,
  BarChart3,
  Calendar,
  Users,
  ExternalLink,
  Settings,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://social-media-post-generator-backend.onrender.com'

const SocialAccountsPage = () => {
  const [accounts, setAccounts] = useState([])
  const [platformStats, setPlatformStats] = useState({})
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState({})
  const [platforms, setPlatforms] = useState([])

  const platformIcons = {
    linkedin: '💼',
    facebook: '📘',
    twitter: '🐦',
    instagram: '📸'
  }

  const platformColors = {
    linkedin: 'bg-blue-100 text-blue-800 border-blue-200',
    facebook: 'bg-blue-100 text-blue-800 border-blue-200',
    twitter: 'bg-sky-100 text-sky-800 border-sky-200',
    instagram: 'bg-pink-100 text-pink-800 border-pink-200'
  }

  useEffect(() => {
    fetchData()
    
    // Handle OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const platform = urlParams.get('platform')
    const account = urlParams.get('account')
    const message = urlParams.get('message')
    
    if (success === 'true' && platform && account) {
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} Account "${account}" erfolgreich verbunden!`)
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Refresh data
      setTimeout(() => fetchData(), 1000)
    } else if (error === 'true' && platform) {
      toast.error(`Fehler beim Verbinden des ${platform.charAt(0).toUpperCase() + platform.slice(1)} Accounts: ${message || 'Unbekannter Fehler'}`)
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchAccounts(),
        fetchStats(),
        fetchPlatforms()
      ])
    } catch (error) {
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/social-accounts/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (response.ok) {
        setAccounts(data.accounts)
        setPlatformStats(data.platform_stats)
      } else {
        toast.error('Fehler beim Laden der Accounts')
      }
    } catch (error) {
      console.error('Fehler beim Laden der Accounts:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social-accounts/stats`)
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error)
    }
  }

  const fetchPlatforms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social-accounts/platforms`)
      const data = await response.json()

      if (response.ok) {
        setPlatforms(data.platforms)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Plattformen:', error)
    }
  }

  const handleConnect = async (platform) => {
    try {
      setConnecting(prev => ({ ...prev, [platform]: true }))
      
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/social-accounts/connect/${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })
      
      const data = await response.json()

      if (response.ok) {
        if (data.redirect && data.oauth_url) {
          // For LinkedIn, redirect to OAuth URL
          toast.success(`Weiterleitung zu ${platform.charAt(0).toUpperCase() + platform.slice(1)}...`)
          window.location.href = data.oauth_url
        } else {
          // For other platforms, handle demo connection
          toast.success(data.message)
          await fetchData()
        }
      } else {
        if (response.status === 409) {
          toast.warning(data.error)
        } else {
          toast.error(data.error || 'Fehler beim Verbinden')
        }
      }
    } catch (error) {
      console.error('Connection error:', error)
      toast.error('Verbindungsfehler')
    } finally {
      setConnecting(prev => ({ ...prev, [platform]: false }))
    }
  }

  const handleDisconnect = async (platform) => {
    if (!confirm(`Sind Sie sicher, dass Sie ${platform.charAt(0).toUpperCase() + platform.slice(1)} trennen möchten?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/social-accounts/disconnect/${platform}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        await fetchData()
      } else {
        toast.error(data.error || 'Fehler beim Trennen')
      }
    } catch (error) {
      toast.error('Verbindungsfehler')
    }
  }

  const getConnectionStatus = (platform) => {
    const stats = platformStats[platform]
    if (!stats) return { status: 'not_connected', icon: XCircle, color: 'text-gray-400' }
    
    if (stats.connected && !stats.expires_soon) {
      return { status: 'connected', icon: CheckCircle, color: 'text-green-500' }
    } else if (stats.connected && stats.expires_soon) {
      return { status: 'expires_soon', icon: AlertCircle, color: 'text-yellow-500' }
    } else {
      return { status: 'disconnected', icon: XCircle, color: 'text-red-500' }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Nie'
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Accounts</h1>
          <p className="text-gray-600 mt-2">Lade Daten...</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Social Media Accounts
          </h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie Ihre verbundenen Social Media Accounts
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verbundene Accounts</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connected_accounts || 0}</div>
            <p className="text-xs text-muted-foreground">
              von {stats.total_platforms || 4} Plattformen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veröffentlichte Posts</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_published || 0}</div>
            <p className="text-xs text-muted-foreground">
              Gesamt veröffentlicht
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Letzte 30 Tage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent_posts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Neue Posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verbindungsrate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connection_rate || '0/4'}</div>
            <p className="text-xs text-muted-foreground">
              Plattformen verbunden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Plattform-Verbindungen</CardTitle>
          <CardDescription>
            Verbinden Sie Ihre Social Media Accounts für direktes Posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platforms.map(platform => {
              const connectionStatus = getConnectionStatus(platform.id)
              const StatusIcon = connectionStatus.icon
              const isConnected = platformStats[platform.id]?.connected
              const accountName = platformStats[platform.id]?.account_name
              const isConnecting = connecting[platform.id]

              return (
                <div key={platform.id} className={`border rounded-lg p-4 ${platformColors[platform.id]}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{platform.icon}</div>
                      <div>
                        <h3 className="font-semibold text-lg">{platform.name}</h3>
                        <p className="text-sm opacity-75">{platform.description}</p>
                        {accountName && (
                          <p className="text-xs font-medium mt-1">
                            Verbunden als: {accountName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`h-5 w-5 ${connectionStatus.color}`} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {platform.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      {isConnected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(platform.id)}
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            Trennen
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4 mr-1" />
                          )}
                          Verbinden
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Platform specific info */}
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium">Max. Zeichen:</span>
                        <p>{platform.max_characters?.toLocaleString() || 'Unbegrenzt'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Unterstützt:</span>
                        <p>
                          {platform.supports_images && '📷 '}
                          {platform.supports_videos && '🎥 '}
                          Text
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Publishing Statistics by Platform */}
      {stats.published_posts && Object.keys(stats.published_posts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Veröffentlichungsstatistiken</CardTitle>
            <CardDescription>
              Anzahl der Posts pro Plattform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.published_posts).map(([platform, count]) => (
                <div key={platform} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">{platformIcons[platform]}</div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{platform}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Accounts Details */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Detaillierte Informationen zu Ihren verbundenen Accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{platformIcons[account.platform]}</div>
                    <div>
                      <h4 className="font-medium capitalize">{account.platform}</h4>
                      <p className="text-sm text-gray-600">{account.account_name}</p>
                      <p className="text-xs text-gray-500">
                        Verbunden: {formatDate(account.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={account.is_connected ? 'default' : 'secondary'}>
                      {account.is_connected ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    {account.expires_at && (
                      <span className="text-xs text-gray-500">
                        Läuft ab: {formatDate(account.expires_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hilfe & Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Wie funktioniert die Verbindung?</h4>
              <p className="text-sm text-blue-800">
                Klicken Sie auf "Verbinden" bei einer Plattform, um den OAuth-Prozess zu starten. 
                Sie werden zur jeweiligen Plattform weitergeleitet, um die Berechtigung zu erteilen.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Direktes Posting</h4>
              <p className="text-sm text-green-800">
                Sobald Ihre Accounts verbunden sind, können Sie Posts direkt aus dem Tool heraus 
                auf allen verbundenen Plattformen veröffentlichen.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Sicherheit</h4>
              <p className="text-sm text-yellow-800">
                Ihre Zugangsdaten werden sicher verschlüsselt gespeichert. Sie können die Verbindung 
                jederzeit trennen, ohne dass Ihre Accounts beeinträchtigt werden.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SocialAccountsPage

