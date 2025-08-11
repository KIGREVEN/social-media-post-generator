import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wand2, Copy, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const SimplePostGeneratorPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://social-media-post-generator-backend.onrender.com'
  
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
      console.log('🚀 Generiere Post ohne Authentication...');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Request body:', JSON.stringify(formData, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/posts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setGeneratedPost(data.post);
        toast.success('Post erfolgreich generiert!');
      } else {
        let errorMessage = data.error || 'Fehler beim Generieren des Posts';
        
        if (response.status === 429) {
          errorMessage = 'Monatliches Limit erreicht.';
        } else if (response.status === 500) {
          errorMessage = 'Server-Fehler: ' + (data.details || 'Unbekannter Fehler');
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Generate post error:', error);
      setError('Verbindungsfehler');
      toast.error('Verbindungsfehler');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Social Media Post Generator
          </h1>
          <p className="text-xl text-gray-600">
            Erstellen Sie professionelle Social Media Posts mit KI-Unterstützung - Keine Anmeldung erforderlich!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Post Generator
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
                <Label>Zielplattform</Label>
                <Select value={formData.platform} onValueChange={(value) => handleChange('platform', value)}>
                  <SelectTrigger>
                    <SelectValue />
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

              <Button 
                onClick={handleGenerate} 
                disabled={loading || !formData.profile_url || !formData.post_theme}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generiere Post...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Post generieren
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Post */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Generierter Post
              </CardTitle>
              <CardDescription>
                Vorschau und Verwendung Ihres generierten Posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedPost ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Plattform: {generatedPost.platform}</h3>
                    <div className="whitespace-pre-wrap text-sm">
                      {generatedPost.content}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCopyToClipboard} variant="outline" className="flex-1">
                      <Copy className="mr-2 h-4 w-4" />
                      Kopieren
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Wand2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Generieren Sie einen Post, um die Vorschau zu sehen</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tipps für bessere Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Website URL</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Verwenden Sie die Haupt-URL der Website</li>
                  <li>• Stellen Sie sicher, dass die Website öffentlich zugänglich ist</li>
                  <li>• Vermeiden Sie Login-geschützte Seiten</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Post-Thema</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Seien Sie spezifisch und klar</li>
                  <li>• Verwenden Sie relevante Keywords</li>
                  <li>• Denken Sie an Ihre Zielgruppe</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SimplePostGeneratorPage

