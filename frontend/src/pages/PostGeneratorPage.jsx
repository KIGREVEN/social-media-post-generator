import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  PlusCircle, 
  Wand2, 
  Copy, 
  Share2, 
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit3,
  Check,
  X
} from 'lucide-react'
import { toast } from 'sonner'

const PostGeneratorPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://social-media-post-generator-backend.onrender.com'
  
  const [formData, setFormData] = useState({
    profile_url: '',
    post_theme: '',
    additional_details: '',
    platforms: ['linkedin'], // Changed from single platform to array
    generate_image: false
  })
  
  const [generatedPost, setGeneratedPost] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingPost, setEditingPost] = useState(null) // ID of post being edited
  const [editedContent, setEditedContent] = useState('') // Content being edited

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', description: 'Professionelle Inhalte', icon: '💼' },
    { id: 'facebook', name: 'Facebook', description: 'Soziale Netzwerke', icon: '📘' },
    { id: 'twitter', name: 'Twitter/X', description: 'Kurze Updates', icon: '🐦' },
    { id: 'instagram', name: 'Instagram', description: 'Visuelle Inhalte', icon: '📸' }
  ]

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handlePlatformToggle = (platformId) => {
    setFormData(prev => {
      const currentPlatforms = prev.platforms || []
      const isSelected = currentPlatforms.includes(platformId)
      
      let newPlatforms
      if (isSelected) {
        // Remove platform if already selected (but keep at least one)
        newPlatforms = currentPlatforms.length > 1 
          ? currentPlatforms.filter(p => p !== platformId)
          : currentPlatforms
      } else {
        // Add platform if not selected
        newPlatforms = [...currentPlatforms, platformId]
      }
      
      return {
        ...prev,
        platforms: newPlatforms
      }
    })
    setError('')
  }

  const handleGenerate = async () => {
    if (!formData.profile_url || !formData.post_theme) {
      setError('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }

    if (!formData.platforms || formData.platforms.length === 0) {
      setError('Bitte wählen Sie mindestens eine Plattform aus')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔍 Debug Info:');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Request body:', JSON.stringify(formData, null, 2));

      // Try with JWT token first
      const token = localStorage.getItem('token')
      let response = await fetch(`${API_BASE_URL}/api/posts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // If JWT token is invalid (422), try debug endpoint without auth
      if (response.status === 422) {
        console.log('JWT token invalid, trying debug endpoint...');
        response = await fetch(`${API_BASE_URL}/api/posts-debug/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        console.log('Debug endpoint response status:', response.status);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        // Handle both single post (backward compatibility) and multiple posts
        if (data.posts && data.posts.length > 0) {
          setGeneratedPost({
            posts: data.posts,
            platforms_generated: data.platforms_generated,
            message: data.message
          });
          toast.success(`${data.posts.length} Posts erfolgreich generiert!`);
        } else if (data.post) {
          // Backward compatibility for single post
          setGeneratedPost({
            posts: [data.post],
            platforms_generated: [data.post.platform],
            message: data.message
          });
          toast.success('Post erfolgreich generiert!');
        }
      } else {
        // Detaillierte Fehlerbehandlung
        let errorMessage = data.error || 'Fehler beim Generieren des Posts';
        
        if (response.status === 429) {
          errorMessage = data.error || 'Monatliches Limit erreicht. Bitte upgraden Sie Ihr Abonnement.';
          if (data.requested_platforms) {
            errorMessage += ` (${data.requested_platforms} Posts benötigt, ${data.remaining_posts} verfügbar)`;
          }
        } else if (response.status === 500) {
          errorMessage = 'Server-Fehler: ' + (data.details || 'Unbekannter Fehler');
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Generate post error:', error);
      let errorMessage = 'Verbindungsfehler';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = (postContent) => {
    if (postContent) {
      navigator.clipboard.writeText(postContent)
      toast.success('Post in Zwischenablage kopiert!')
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post.id)
    setEditedContent(post.content)
  }

  const handleCancelEdit = () => {
    setEditingPost(null)
    setEditedContent('')
  }

  const handleSaveEdit = async (postId) => {
    if (!editedContent.trim()) {
      toast.error('Post-Inhalt darf nicht leer sein')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: editedContent.trim()
        })
      })

      if (response.ok) {
        // Update the local state
        setGeneratedPost(prev => ({
          ...prev,
          posts: prev.posts.map(post => 
            post.id === postId 
              ? { ...post, content: editedContent.trim() }
              : post
          )
        }))
        
        setEditingPost(null)
        setEditedContent('')
        toast.success('Post erfolgreich bearbeitet!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Fehler beim Speichern der Änderungen')
      }
    } catch (error) {
      console.error('Save edit error:', error)
      toast.error('Verbindungsfehler beim Speichern')
    }
  }

  const handlePublish = async (platform) => {
    if (!generatedPost) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/social-accounts/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          post_id: generatedPost.id,
          platforms: [platform]
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Post erfolgreich auf ${platform} veröffentlicht!`)
      } else {
        toast.error(data.error || `Fehler beim Veröffentlichen auf ${platform}`)
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Verbindungsfehler beim Veröffentlichen')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Post Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Erstellen Sie professionelle Social Media Posts mit KI-Unterstützung
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5" />
              <span>Post Generator</span>
            </CardTitle>
            <CardDescription>
              Geben Sie die Details ein, um einen professionellen Post zu generieren
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="profile_url">Website URL *</Label>
              <Input
                id="profile_url"
                type="url"
                placeholder="https://example.com"
                value={formData.profile_url}
                onChange={(e) => handleChange('profile_url', e.target.value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Die Website, die Sie bewerben möchten
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post_theme">Post-Thema *</Label>
              <Input
                id="post_theme"
                placeholder="z.B. Neue Produkteinführung, Unternehmensnews, etc."
                value={formData.post_theme}
                onChange={(e) => handleChange('post_theme', e.target.value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Das Hauptthema oder der Fokus Ihres Posts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_details">Zusätzliche Details</Label>
              <Textarea
                id="additional_details"
                placeholder="Weitere Informationen, die in den Post einbezogen werden sollen..."
                value={formData.additional_details}
                onChange={(e) => handleChange('additional_details', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Zielplattformen</Label>
              <div className="grid grid-cols-2 gap-3">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className={`
                      p-3 border rounded-lg cursor-pointer transition-all
                      ${formData.platforms?.includes(platform.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                    onClick={() => handlePlatformToggle(platform.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="text-lg">{platform.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm dark:text-white">{platform.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{platform.description}</div>
                      </div>
                      <div className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center
                        ${formData.platforms?.includes(platform.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                        }
                      `}>
                        {formData.platforms?.includes(platform.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Wählen Sie eine oder mehrere Plattformen aus. Für jede Plattform wird ein optimierter Post generiert.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="generate_image"
                checked={formData.generate_image}
                onCheckedChange={(checked) => handleChange('generate_image', checked)}
              />
              <Label htmlFor="generate_image" className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span>Bild automatisch generieren</span>
              </Label>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generiere Posts...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {formData.platforms?.length > 1 
                    ? `${formData.platforms.length} Posts generieren`
                    : 'Post generieren'
                  }
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Post Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5" />
              <span>Generierter Post</span>
            </CardTitle>
            <CardDescription>
              Vorschau und Veröffentlichung Ihres generierten Posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedPost && generatedPost.posts ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {generatedPost.posts.length} Posts generiert
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      für {generatedPost.platforms_generated?.join(', ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString('de-DE')}
                  </div>
                </div>

                {/* Posts */}
                <div className="space-y-6">
                  {generatedPost.posts.map((post, index) => (
                    <div key={post.id || index} className="border rounded-lg p-4 dark:border-gray-600">
                      {/* Platform Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {platforms.find(p => p.id === post.platform)?.icon || '📱'}
                          </span>
                          <Badge variant="secondary" className="capitalize">
                            {post.platform}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(post.created_at).toLocaleDateString('de-DE')}
                          </div>
                          {/* Edit Button */}
                          {editingPost === post.id ? (
                            <div className="flex items-center space-x-1">
                              <Button
                                onClick={() => handleSaveEdit(post.id)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleEditPost(post)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Generated Image */}
                      {post.generated_image_url && (
                        <div className="space-y-2 mb-4">
                          <Label>Generiertes Bild</Label>
                          <img 
                            src={post.generated_image_url} 
                            alt="Generated content" 
                            className="w-full rounded-lg border dark:border-gray-600"
                          />
                        </div>
                      )}

                      {/* Post Content */}
                      <div className="space-y-2 mb-4">
                        <Label>Post-Inhalt</Label>
                        {editingPost === post.id ? (
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="min-h-[120px] dark:bg-gray-800 dark:border-gray-600"
                            placeholder="Post-Inhalt bearbeiten..."
                          />
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600">
                            <p className="whitespace-pre-wrap text-sm dark:text-gray-200">
                              {post.content}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions for each post */}
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleCopyToClipboard(post.content)} 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          disabled={editingPost === post.id}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Kopieren
                        </Button>
                        <Button
                          onClick={() => handlePublish(post.platform)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={editingPost === post.id}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Veröffentlichen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Global Actions */}
                <div className="border-t pt-4 dark:border-gray-600">
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Alle Posts wurden automatisch gespeichert</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sie finden diese Posts in Ihrer Post-Übersicht unter "Meine Posts"
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Generieren Sie Posts, um die Vorschau zu sehen</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tipps für bessere Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 dark:text-white">Website URL</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Verwenden Sie die Haupt-URL der Website</li>
                <li>• Stellen Sie sicher, dass die Website öffentlich zugänglich ist</li>
                <li>• Vermeiden Sie Login-geschützte Seiten</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 dark:text-white">Post-Thema</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Seien Sie spezifisch und klar</li>
                <li>• Verwenden Sie relevante Keywords</li>
                <li>• Denken Sie an Ihre Zielgruppe</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PostGeneratorPage

