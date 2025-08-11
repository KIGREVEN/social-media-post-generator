import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  PlusCircle, 
  FileText, 
  Share2, 
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Activity
} from 'lucide-react'

const DashboardPage = () => {
  const { user, token, API_BASE_URL } = useAuth()
  const [stats, setStats] = useState({
    usage: null,
    recentPosts: [],
    connectedAccounts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch current user profile with updated subscription info
      const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Fetch recent posts
      const postsResponse = await fetch(`${API_BASE_URL}/api/posts?per_page=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Fetch connected accounts
      const accountsResponse = await fetch(`${API_BASE_URL}/api/social/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const [profileData, postsData, accountsData] = await Promise.all([
        profileResponse.ok ? profileResponse.json() : { user: null },
        postsResponse.ok ? postsResponse.json() : { posts: [] },
        accountsResponse.ok ? accountsResponse.json() : { accounts: [] }
      ])

      // Use post_usage from profile data for accurate limits
      const usage = profileData.user?.post_usage || null

      setStats({
        usage: usage,
        recentPosts: postsData.posts || [],
        connectedAccounts: accountsData.accounts || []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = () => {
    if (!stats.usage) return 0
    return (stats.usage.posts_generated / stats.usage.monthly_limit) * 100
  }

  const getRemainingPosts = () => {
    if (!stats.usage) return 0
    return stats.usage.monthly_limit - stats.usage.posts_generated
  }

  const quickActions = [
    {
      title: 'Neuen Post erstellen',
      description: 'Generiere einen professionellen Social Media Post',
      icon: <PlusCircle className="w-6 h-6" />,
      link: '/generate',
      color: 'bg-blue-500'
    },
    {
      title: 'Meine Posts',
      description: 'Verwalte deine erstellten Posts',
      icon: <FileText className="w-6 h-6" />,
      link: '/posts',
      color: 'bg-green-500'
    },
    {
      title: 'Social Accounts',
      description: 'Verbinde deine Social Media Accounts',
      icon: <Share2 className="w-6 h-6" />,
      link: '/social-accounts',
      color: 'bg-purple-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Willkommen zurück, {user?.username}!
        </h1>
        <p className="text-gray-600 mt-2">
          Hier ist Ihr Dashboard für den Social Media Post Generator
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts erstellt</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.usage?.posts_generated || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verbleibende Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getRemainingPosts()}
            </div>
            <p className="text-xs text-muted-foreground">
              Von {stats.usage?.monthly_limit || 10} verfügbar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verbundene Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.connectedAccounts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Social Media Plattformen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts veröffentlicht</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.usage?.posts_posted || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Diesen Monat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Monatliche Nutzung</span>
          </CardTitle>
          <CardDescription>
            Ihr Fortschritt für diesen Monat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Posts generiert</span>
              <span>{stats.usage?.posts_generated || 0} / {stats.usage?.monthly_limit || 10}</span>
            </div>
            <Progress value={getUsagePercentage()} className="w-full" />
          </div>
          
          {getRemainingPosts() <= 2 && getRemainingPosts() > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Sie haben nur noch {getRemainingPosts()} Posts für diesen Monat übrig.
              </p>
            </div>
          )}
          
          {getRemainingPosts() === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                🚫 Sie haben Ihr monatliches Limit erreicht. Das Limit wird am 1. des nächsten Monats zurückgesetzt.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
          <CardDescription>
            Häufig verwendete Funktionen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${action.color} text-white`}>
                        {action.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Neueste Posts</span>
              <Link to="/posts">
                <Button variant="outline" size="sm">
                  Alle anzeigen
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Ihre zuletzt erstellten Posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentPosts.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{post.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(post.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {post.platform}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Posts erstellt</p>
                <Link to="/generate">
                  <Button className="mt-2" size="sm">
                    Ersten Post erstellen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Verbundene Accounts</span>
              <Link to="/social-accounts">
                <Button variant="outline" size="sm">
                  Verwalten
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Ihre Social Media Verbindungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.connectedAccounts.length > 0 ? (
              <div className="space-y-3">
                {stats.connectedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Share2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm capitalize">{account.platform}</p>
                        <p className="text-xs text-gray-500">{account.account_name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Verbunden
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Share2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Keine Accounts verbunden</p>
                <Link to="/social-accounts">
                  <Button className="mt-2" size="sm">
                    Account verbinden
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage

