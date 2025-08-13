import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Calendar,
  BarChart3,
  FileText,
  Image,
  ExternalLink,
  Share2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://social-media-post-generator-backend.onrender.com'

const PostsPage = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [stats, setStats] = useState({})
  const [selectedPost, setSelectedPost] = useState(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [publishing, setPublishing] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [scheduleForm, setScheduleForm] = useState({
    platform: 'linkedin',
    scheduled_date: '',
    scheduled_time: '',
    timezone: 'Europe/Berlin'
  })

  const platforms = [
    { value: '', label: 'Alle Plattformen' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' }
  ]

  const platformColors = {
    linkedin: 'bg-blue-100 text-blue-800',
    facebook: 'bg-blue-100 text-blue-800',
    instagram: 'bg-pink-100 text-pink-800',
    twitter: 'bg-sky-100 text-sky-800'
  }

  useEffect(() => {
    fetchPosts()
    fetchStats()
    fetchConnectedAccounts()
  }, [currentPage, selectedPlatform, searchTerm])

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social-accounts/accounts`)
      const data = await response.json()

      if (response.ok) {
        setConnectedAccounts(data.accounts.filter(acc => acc.is_active))
      }
    } catch (error) {
      console.error('Fehler beim Laden der verbundenen Accounts:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '10'
      })
      
      if (selectedPlatform) params.append('platform', selectedPlatform)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`${API_BASE_URL}/api/library/posts?${params}`)
      const data = await response.json()

      if (response.ok) {
        setPosts(data.posts)
        setPagination(data.pagination)
      } else {
        toast.error('Fehler beim Laden der Posts')
      }
    } catch (error) {
      toast.error('Verbindungsfehler beim Laden der Posts')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/library/posts/stats`)
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Post löschen möchten?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/library/posts/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Post erfolgreich gelöscht')
        fetchPosts()
        fetchStats()
      } else {
        toast.error('Fehler beim Löschen des Posts')
      }
    } catch (error) {
      toast.error('Verbindungsfehler beim Löschen')
    }
  }

  const handleDuplicatePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/library/posts/${postId}/duplicate`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Post erfolgreich dupliziert')
        fetchPosts()
        fetchStats()
      } else {
        toast.error('Fehler beim Duplizieren des Posts')
      }
    } catch (error) {
      toast.error('Verbindungsfehler beim Duplizieren')
    }
  }

  const handleViewPost = (post) => {
    setSelectedPost(post)
    setShowPostModal(true)
  }

  const handlePublishPost = (post) => {
    setSelectedPost(post)
    setSelectedPlatforms([])
    setShowPublishModal(true)
  }

  const handleSchedulePost = (post) => {
    setSelectedPost(post)
    setScheduleForm({
      platform: 'linkedin',
      scheduled_date: '',
      scheduled_time: '',
      timezone: 'Europe/Berlin'
    })
    setShowScheduleModal(true)
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Plattform aus')
      return
    }

    try {
      setPublishing(true)
      
      const response = await fetch(`${API_BASE_URL}/api/social-accounts/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: selectedPost.id,
          platforms: selectedPlatforms
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setShowPublishModal(false)
        fetchPosts()
        fetchStats()
      } else {
        toast.error(data.error || 'Fehler beim Veröffentlichen')
      }
    } catch (error) {
      toast.error('Verbindungsfehler beim Veröffentlichen')
    } finally {
      setPublishing(false)
    }
  }

  const handleScheduleSubmit = async () => {
    // Validate form
    if (!scheduleForm.scheduled_date || !scheduleForm.scheduled_time) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus')
      return
    }

    // Check if scheduled time is in the future
    const scheduledDateTime = new Date(`${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}`)
    const now = new Date()
    
    if (scheduledDateTime <= now) {
      toast.error('Der geplante Zeitpunkt muss in der Zukunft liegen')
      return
    }

    try {
      setScheduling(true)
      
      const response = await fetch(`${API_BASE_URL}/api/scheduler/schedule-existing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: selectedPost.id,
          platform: scheduleForm.platform,
          scheduled_date: scheduleForm.scheduled_date,
          scheduled_time: scheduleForm.scheduled_time,
          timezone: scheduleForm.timezone,
          user_id: 1
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Post erfolgreich geplant!')
        setShowScheduleModal(false)
        // Optionally refresh posts or show scheduled posts
      } else {
        toast.error(data.error || 'Fehler beim Planen des Posts')
      }
    } catch (error) {
      console.error('Error scheduling post:', error)
      toast.error('Verbindungsfehler beim Planen des Posts')
    } finally {
      setScheduling(false)
    }
  }

  // Get minimum date (today) for date input
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Get minimum time for today
  const getMinTime = () => {
    if (scheduleForm.scheduled_date === getMinDate()) {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes() + 1).padStart(2, '0') // Add 1 minute buffer
      return `${hours}:${minutes}`
    }
    return '00:00'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Meine Posts
        </h1>
        <p className="text-gray-600 mt-2">
          Verwalten Sie alle Ihre erstellten Social Media Posts
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_posts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veröffentlicht</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.posted_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entwürfe</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diese Woche</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent_posts || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Suche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Posts durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {platforms.map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Posts Übersicht</CardTitle>
          <CardDescription>
            {pagination.total || 0} Posts gefunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Lade Posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Keine Posts gefunden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.platform && (
                          <Badge className={platformColors[post.platform] || 'bg-gray-100 text-gray-800'}>
                            {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                          </Badge>
                        )}
                        {post.is_posted && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Veröffentlicht
                          </Badge>
                        )}
                        {post.generated_image_url && (
                          <Badge variant="outline" className="text-purple-600 border-purple-600">
                            <Image className="h-3 w-3 mr-1" />
                            Mit Bild
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {post.title || post.post_theme || 'Untitled Post'}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-2">
                        {truncateText(post.content)}
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        Erstellt: {formatDate(post.created_at)}
                        {post.posted_at && (
                          <span> • Veröffentlicht: {formatDate(post.posted_at)}</span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPost(post)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSchedulePost(post)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Post planen"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishPost(post)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicatePost(post.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_prev}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Zurück
              </Button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Seite {pagination.page} von {pagination.pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_next}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Weiter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Detail Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">
                  {selectedPost.title || selectedPost.post_theme || 'Post Details'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPostModal(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  {selectedPost.platform && (
                    <Badge className={platformColors[selectedPost.platform] || 'bg-gray-100 text-gray-800'}>
                      {selectedPost.platform.charAt(0).toUpperCase() + selectedPost.platform.slice(1)}
                    </Badge>
                  )}
                  {selectedPost.is_posted && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Veröffentlicht
                    </Badge>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Inhalt:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                  </div>
                </div>
                
                {selectedPost.generated_image_url && (
                  <div>
                    <h3 className="font-semibold mb-2">Generiertes Bild:</h3>
                    <img 
                      src={selectedPost.generated_image_url} 
                      alt="Generated content" 
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Erstellt:</span>
                    <p>{formatDate(selectedPost.created_at)}</p>
                  </div>
                  {selectedPost.posted_at && (
                    <div>
                      <span className="font-semibold">Veröffentlicht:</span>
                      <p>{formatDate(selectedPost.posted_at)}</p>
                    </div>
                  )}
                </div>
                
                {selectedPost.post_theme && (
                  <div>
                    <span className="font-semibold">Thema:</span>
                    <p>{selectedPost.post_theme}</p>
                  </div>
                )}
                
                {selectedPost.profile_url && (
                  <div>
                    <span className="font-semibold">Profil URL:</span>
                    <p className="break-all text-blue-600">{selectedPost.profile_url}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Post veröffentlichen</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPublishModal(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Post:</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">{truncateText(selectedPost.content, 100)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Plattformen auswählen:</h3>
                  <div className="space-y-2">
                    {connectedAccounts.map(account => (
                      <label key={account.platform} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(account.platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPlatforms([...selectedPlatforms, account.platform])
                            } else {
                              setSelectedPlatforms(selectedPlatforms.filter(p => p !== account.platform))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{account.platform}</span>
                        <Badge className={platformColors[account.platform] || 'bg-gray-100 text-gray-800'}>
                          {account.account_name}
                        </Badge>
                      </label>
                    ))}
                  </div>
                  
                  {connectedAccounts.length === 0 && (
                    <p className="text-sm text-gray-600">
                      Keine verbundenen Accounts gefunden. 
                      <a href="/social-accounts" className="text-blue-600 hover:underline ml-1">
                        Accounts verbinden
                      </a>
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handlePublish}
                    disabled={publishing || selectedPlatforms.length === 0}
                    className="flex-1"
                  >
                    {publishing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Veröffentliche...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        Veröffentlichen
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPublishModal(false)}
                    disabled={publishing}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostsPage


      {/* Schedule Modal */}
      {showScheduleModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Post planen</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScheduleModal(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Post:</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">{selectedPost.title || selectedPost.post_theme || 'Untitled Post'}</p>
                    <p className="text-sm text-gray-600 mt-1">{truncateText(selectedPost.content, 100)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Plattform</label>
                  <select
                    value={scheduleForm.platform}
                    onChange={(e) => setScheduleForm({...scheduleForm, platform: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Datum</label>
                  <input
                    type="date"
                    value={scheduleForm.scheduled_date}
                    onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                    min={getMinDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Uhrzeit</label>
                  <input
                    type="time"
                    value={scheduleForm.scheduled_time}
                    onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})}
                    min={getMinTime()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Zeitzone</label>
                  <select
                    value={scheduleForm.timezone}
                    onChange={(e) => setScheduleForm({...scheduleForm, timezone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Europe/Berlin">Europa/Berlin (MEZ)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Amerika/New York (EST)</option>
                    <option value="America/Los_Angeles">Amerika/Los Angeles (PST)</option>
                  </select>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleScheduleSubmit}
                    disabled={scheduling || !scheduleForm.scheduled_date || !scheduleForm.scheduled_time}
                    className="flex-1"
                  >
                    {scheduling ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Plane...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Post planen
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowScheduleModal(false)}
                    disabled={scheduling}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostsPage

// Trigger deployment
