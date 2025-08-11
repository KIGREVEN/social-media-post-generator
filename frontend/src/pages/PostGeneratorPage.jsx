import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
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
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

const PostGeneratorPage = () => {
  const { token, API_BASE_URL } = useAuth()
  
  const [formData, setFormData] = useState({
    profile_url: '',
    post_theme: '',
    additional_details: '',
    platform: 'linkedin',
    generate_image: false
  })
  
  const [generatedPost, setGeneratedPost] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', description: 'Professionelle Inhalte' },
    { id: 'facebook', name: 'Facebook', description: 'Soziale Netzwerke' },
    { id: 'twitter', name: 'Twitter/X', description: 'Kurze Updates' },
    { id: 'instagram', name: 'Instagram', description: 'Visuelle Inhalte' }
  ]

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleGenerate = async () => {
    if (!formData.profile_url || !formData.post_theme) {
      setError('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Debug: Token-Validierung
      console.log('🔍 Debug Info:');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('API_BASE_URL:', API_BASE_URL);
      
      // Validiere Token vor Request
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token verfügbar. Bitte melden Sie sich erneut an.');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Request headers:', headers);
      console.log('Request body:', JSON.stringify(formData, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/posts/generate`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setGeneratedPost(data.post);
        toast.success('Post erfolgreich generiert!');
      } else {
        // Detaillierte Fehlerbehandlung
        let errorMessage = data.error || 'Fehler beim Generieren des Posts';
        
        if (response.status === 401) {
          errorMessage = 'Authentifizierung fehlgeschlagen. Bitte melden Sie sich erneut an.';
        } else if (response.status === 422) {
          errorMessage = 'Token-Validierung fehlgeschlagen: ' + (data.error || 'Unbekannter Fehler');
        } else if (response.status === 429) {
          errorMessage = 'Monatliches Limit erreicht. Bitte upgraden Sie Ihr Abonnement.';
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Generate post error:', error);
      let errorMessage = 'Verbindungsfehler';
      
      if (error.message.includes('Token')) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = () => {
    if (generatedPost?.content) {
      navigator.clipboard.writeText(generatedPost.content)
      toast.success('Post in Zwischenablage kopiert!')
    }
  }

  const handlePublish = async (platform) => {
    if (!generatedPost) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/social/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: platform,
          content: generatedPost.content,
          image_url: generatedPost.generated_image_url
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
        <h1 className="text-3xl font-bold text-gray-900">
          Post Generator
        </h1>
        <p className="text-gray-600 mt-2">
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
              <p className="text-sm text-gray-500">
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
              <p className="text-sm text-gray-500">
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
              <Label htmlFor="platform">Zielplattform</Label>
              <Select value={formData.platform} onValueChange={(value) => handleChange('platform', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Plattform auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      <div className="flex flex-col">
                        <span>{platform.name}</span>
                        <span className="text-sm text-gray-500">{platform.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  Generiere Post...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Post generieren
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
            {generatedPost ? (
              <div className="space-y-6">
                {/* Platform Badge */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="capitalize">
                    {generatedPost.platform}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {new Date(generatedPost.created_at).toLocaleDateString('de-DE')}
                  </div>
                </div>

                {/* Generated Image */}
                {generatedPost.generated_image_url && (
                  <div className="space-y-2">
                    <Label>Generiertes Bild</Label>
                    <img 
                      src={generatedPost.generated_image_url} 
                      alt="Generated content" 
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}

                {/* Post Content */}
                <div className="space-y-2">
                  <Label>Post-Inhalt</Label>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="whitespace-pre-wrap text-sm">
                      {generatedPost.content}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <Button 
                    onClick={handleCopyToClipboard} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    In Zwischenablage kopieren
                  </Button>

                  <Tabs defaultValue="publish" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="publish">Veröffentlichen</TabsTrigger>
                      <TabsTrigger value="save">Speichern</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="publish" className="space-y-2">
                      <p className="text-sm text-gray-600 mb-3">
                        Veröffentlichen Sie direkt auf Ihren verbundenen Social Media Accounts
                      </p>
                      {platforms.map((platform) => (
                        <Button
                          key={platform.id}
                          onClick={() => handlePublish(platform.id)}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Auf {platform.name} veröffentlichen
                        </Button>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="save" className="space-y-2">
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Post wurde automatisch gespeichert</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Sie finden diesen Post in Ihrer Post-Übersicht unter "Meine Posts"
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Generieren Sie einen Post, um die Vorschau zu sehen</p>
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
              <h4 className="font-medium mb-2">Website URL</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Verwenden Sie die Haupt-URL der Website</li>
                <li>• Stellen Sie sicher, dass die Website öffentlich zugänglich ist</li>
                <li>• Vermeiden Sie Login-geschützte Seiten</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Post-Thema</h4>
              <ul className="space-y-1 text-gray-600">
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

