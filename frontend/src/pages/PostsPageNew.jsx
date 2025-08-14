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
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  X
} from 'lucide-react'
import { toast } from 'sonner'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://social-media-post-generator-backend.onrender.com'

const PostsPageNew = () => {
  const [postGroups, setPostGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const [stats, setStats] = useState({})
  const [calendarData, setCalendarData] = useState({})
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showGroupScheduleModal, setShowGroupScheduleModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [scheduleForm, setScheduleForm] = useState({
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
    linkedin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    facebook: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    instagram: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    twitter: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
  }

  const statusColors = {
    'ungeplant': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    'geplant': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'veröffentlicht': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }

  const statusIcons = {
    'ungeplant': AlertCircle,
    'geplant': Clock,
    'veröffentlicht': CheckCircle
  }

  useEffect(() => {
    fetchPostGroups()
    fetchStats()
    fetchCalendarData()
  }, [selectedPlatform, searchTerm])

  const fetchPostGroups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        per_page: '1000'
      })
      
      if (selectedPlatform) params.append('platform', selectedPlatform)
      if (searchTerm) params.append('search', searchTerm)

      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (response.ok) {
        // Group posts by post_group_id or post_theme
        const grouped = groupPosts(data.posts)
        setPostGroups(grouped)
      } else {
        toast.error('Fehler beim Laden der Posts')
      }
    } catch (error) {
      toast.error('Verbindungsfehler beim Laden der Posts')
    } finally {
      setLoading(false)
    }
  }

  const groupPosts = (posts) => {
    const groups = {}
    
    posts.forEach(post => {
      const groupKey = post.post_group_id || `single_${post.id}`
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          theme: post.post_theme || 'Untitled',
          posts: [],
          created_at: post.created_at,
          status: 'ungeplant' // Will be calculated
        }
      }
      
      groups[groupKey].posts.push(post)
    })

    // Calculate group status and sort posts within groups
    Object.values(groups).forEach(group => {
      // Sort posts by platform
      group.posts.sort((a, b) => {
        const platformOrder = ['linkedin', 'facebook', 'instagram', 'twitter']
        return platformOrder.indexOf(a.platform) - platformOrder.indexOf(b.platform)
      })

      // Calculate group status based on posts
      const statuses = group.posts.map(p => p.status || (p.is_posted ? 'veröffentlicht' : 'ungeplant'))
      if (statuses.every(s => s === 'veröffentlicht')) {
        group.status = 'veröffentlicht'
      } else if (statuses.some(s => s === 'geplant')) {
        group.status = 'geplant'
      } else {
        group.status = 'ungeplant'
      }
    })

    return Object.values(groups).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/posts?per_page=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (response.ok) {
        const totalPosts = data.total || 0
        const publishedPosts = data.posts ? data.posts.filter(post => post.is_posted || post.status === 'veröffentlicht').length : 0
        const scheduledPosts = data.posts ? data.posts.filter(post => post.status === 'geplant').length : 0
        const draftPosts = totalPosts - publishedPosts - scheduledPosts
        
        setStats({
          total_posts: totalPosts,
          published_posts: publishedPosts,
          scheduled_posts: scheduledPosts,
          draft_posts: draftPosts
        })
      }
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error)
    }
  }

  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/posts?per_page=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (response.ok) {
        const calendar = {}
        
        data.posts?.forEach(post => {
          // Add scheduled posts
          if (post.scheduled_at) {
            const date = new Date(post.scheduled_at).toDateString()
            if (!calendar[date]) calendar[date] = { scheduled: [], published: [] }
            calendar[date].scheduled.push(post)
          }
          
          // Add published posts
          if (post.posted_at) {
            const date = new Date(post.posted_at).toDateString()
            if (!calendar[date]) calendar[date] = { scheduled: [], published: [] }
            calendar[date].published.push(post)
          }
        })
        
        setCalendarData(calendar)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kalenderdaten:', error)
    }
  }

  const toggleGroupExpansion = (groupId) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const handlePublishPost = async (post) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/social-accounts/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: post.id,
          platforms: [post.platform]  // API erwartet platforms Array
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Post auf ${post.platform} veröffentlicht!`)
        fetchPostGroups()
        fetchStats()
        fetchCalendarData()
      } else {
        toast.error(data.error || 'Fehler beim Veröffentlichen')
      }
    } catch (error) {
      toast.error('Verbindungsfehler beim Veröffentlichen')
    }
  }

  const handleCancelSchedule = async (post) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ungeplant',
          scheduled_at: null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Planung erfolgreich storniert!')
        fetchPostGroups()
        fetchStats()
        fetchCalendarData()
      } else {
        toast.error(data.error || 'Fehler beim Stornieren der Planung')
      }
    } catch (error) {
      toast.error('Verbindungsfehler beim Stornieren')
    }
  }

  const handleSchedulePost = (post) => {
    setSelectedPost(post)
    setScheduleForm({
      scheduled_date: '',
      scheduled_time: '',
      timezone: 'Europe/Berlin'
    })
    setShowScheduleModal(true)
  }

  const handleScheduleGroup = (group) => {
    setSelectedGroup(group)
    setScheduleForm({
      scheduled_date: '',
      scheduled_time: '',
      timezone: 'Europe/Berlin'
    })
    setShowGroupScheduleModal(true)
  }

  const handleGroupScheduleSubmit = async () => {
    if (!scheduleForm.scheduled_date || !scheduleForm.scheduled_time) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus')
      return
    }

    const scheduledDateTime = new Date(`${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}`)
    const now = new Date()
    
    if (scheduledDateTime <= now) {
      toast.error('Der geplante Zeitpunkt muss in der Zukunft liegen')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const updatePromises = selectedGroup.posts
        .filter(post => !post.is_posted && post.status !== 'veröffentlicht')
        .map(post => 
          fetch(`${API_BASE_URL}/api/posts/${post.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'geplant',
              scheduled_at: scheduledDateTime.toISOString()
            })
          })
        )

      const results = await Promise.all(updatePromises)
      const successCount = results.filter(response => response.ok).length

      if (successCount === updatePromises.length) {
        toast.success(`Alle ${successCount} Posts erfolgreich geplant!`)
      } else {
        toast.warning(`${successCount} von ${updatePromises.length} Posts geplant`)
      }

      setShowGroupScheduleModal(false)
      fetchPostGroups()
      fetchStats()
      fetchCalendarData()
    } catch (error) {
      toast.error('Fehler beim Planen der Posts')
    }
  }

  const handleScheduleSubmit = async () => {
    if (!scheduleForm.scheduled_date || !scheduleForm.scheduled_time) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus')
      return
    }

    const scheduledDateTime = new Date(`${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}`)
    const now = new Date()
    
    if (scheduledDateTime <= now) {
      toast.error('Der geplante Zeitpunkt muss in der Zukunft liegen')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'geplant',
          scheduled_at: scheduledDateTime.toISOString()
        })
      })

      if (response.ok) {
        toast.success('Post erfolgreich geplant!')
        setShowScheduleModal(false)
        fetchPostGroups()
        fetchStats()
        fetchCalendarData()
      } else {
        toast.error('Fehler beim Planen des Posts')
      }
    } catch (error) {
      toast.error('Verbindungsfehler beim Planen des Posts')
    }
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ]

    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kalender</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dateKey = day.toDateString()
              const dayData = calendarData[dateKey]
              const isCurrentMonth = day.getMonth() === month
              const isToday = day.toDateString() === new Date().toDateString()
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[60px] p-1 border rounded-lg text-sm
                    ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    border-gray-200 dark:border-gray-700
                  `}
                >
                  <div className={`font-medium ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {day.getDate()}
                  </div>
                  {dayData && (
                    <div className="space-y-1">
                      {dayData.scheduled.map((post, postIndex) => (
                        <div key={`scheduled-${postIndex}`} className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-1 rounded">
                          {post.title} geplant
                        </div>
                      ))}
                      {dayData.published.map((post, postIndex) => (
                        <div key={`published-${postIndex}`} className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1 rounded">
                          {post.title} veröffentlicht
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
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

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Meine Posts
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
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
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published_posts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geplant</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.scheduled_posts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entwürfe</CardTitle>
            <Edit className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft_posts || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Widget */}
      {renderCalendar()}

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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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

      {/* Post Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Posts Übersicht</CardTitle>
          <CardDescription>
            {postGroups.length} Post-Gruppen gefunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Lade Posts...</p>
            </div>
          ) : postGroups.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Keine Posts gefunden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {postGroups.map(group => {
                const StatusIcon = statusIcons[group.status]
                const isExpanded = expandedGroups.has(group.id)
                
                return (
                  <div key={group.id} className="border dark:border-gray-600 rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleGroupExpansion(group.id)}
                            className="p-1"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {group.theme}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={statusColors[group.status]}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {group.status}
                              </Badge>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {group.posts.length} Posts
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(group.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                          {/* Group Actions Only */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleScheduleGroup(group)}
                            disabled={group.posts.every(post => post.is_posted || post.status === 'veröffentlicht')}
                            className="mr-2"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Alle planen
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        {group.posts.map(post => {
                          const PostStatusIcon = statusIcons[post.status || (post.is_posted ? 'veröffentlicht' : 'ungeplant')]
                          const postStatus = post.status || (post.is_posted ? 'veröffentlicht' : 'ungeplant')
                          
                          return (
                            <div key={post.id} className="border dark:border-gray-600 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className={platformColors[post.platform]}>
                                      {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                                    </Badge>
                                    <Badge className={statusColors[postStatus]}>
                                      <PostStatusIcon className="h-3 w-3 mr-1" />
                                      {postStatus}
                                    </Badge>
                                    {post.generated_image_url && (
                                      <Badge variant="outline" className="text-purple-600 border-purple-600">
                                        <Image className="h-3 w-3 mr-1" />
                                        Mit Bild
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                                    {truncateText(post.content)}
                                  </p>
                                  
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Erstellt: {formatDate(post.created_at)}
                                    {post.scheduled_at && (
                                      <span> • Geplant: {formatDate(post.scheduled_at)}</span>
                                    )}
                                    {post.posted_at && (
                                      <span> • Veröffentlicht: {formatDate(post.posted_at)}</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePublishPost(post)}
                                disabled={post.is_posted || post.status === 'veröffentlicht'}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Veröffentlichen
                              </Button>
                              
                              {post.status === 'geplant' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelSchedule(post)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Stornieren
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSchedulePost(post)}
                                  disabled={post.is_posted || post.status === 'veröffentlicht'}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Planen
                                </Button>
                              )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Bearbeiten
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Post planen
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Datum
                </label>
                <Input
                  type="date"
                  value={scheduleForm.scheduled_date}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                  min={getMinDate()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Uhrzeit
                </label>
                <Input
                  type="time"
                  value={scheduleForm.scheduled_time}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
              >
                Abbrechen
              </Button>
              <Button onClick={handleScheduleSubmit}>
                Planen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Group Schedule Modal */}
      {showGroupScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Alle Posts planen
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{selectedGroup?.theme}</strong>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                {selectedGroup?.posts.filter(post => !post.is_posted && post.status !== 'veröffentlicht').length} Posts werden geplant
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Datum
                </label>
                <Input
                  type="date"
                  value={scheduleForm.scheduled_date}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                  min={getMinDate()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Uhrzeit
                </label>
                <Input
                  type="time"
                  value={scheduleForm.scheduled_time}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowGroupScheduleModal(false)}
              >
                Abbrechen
              </Button>
              <Button onClick={handleGroupScheduleSubmit}>
                Alle planen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostsPageNew

