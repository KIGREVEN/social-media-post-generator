import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Share2, Eye, EyeOff, CheckCircle } from 'lucide-react'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData

    if (!username || !email || !password || !confirmPassword) {
      return 'Bitte füllen Sie alle Felder aus'
    }

    if (username.length < 3) {
      return 'Benutzername muss mindestens 3 Zeichen lang sein'
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    }

    if (password.length < 6) {
      return 'Passwort muss mindestens 6 Zeichen lang sein'
    }

    if (password !== confirmPassword) {
      return 'Passwörter stimmen nicht überein'
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    const { username, email, password } = formData

    const result = await register(username, email, password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Registrierung fehlgeschlagen')
    }
    
    setLoading(false)
  }

  const features = [
    'Kostenlose Registrierung',
    '10 Posts pro Monat inklusive',
    'KI-gestützte Post-Generierung',
    'Multi-Platform Publishing',
    'Bildgenerierung mit DALL-E'
  ]

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration Form */}
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Share2 className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Kostenloses Konto erstellen
            </h1>
            <p className="text-gray-600">
              Starten Sie noch heute mit der Erstellung professioneller Social Media Posts
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registrierung</CardTitle>
              <CardDescription>
                Erstellen Sie Ihr kostenloses Konto in wenigen Schritten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Benutzername</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Wählen Sie einen Benutzernamen"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ihre@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mindestens 6 Zeichen"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Passwort wiederholen"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Konto wird erstellt...' : 'Kostenloses Konto erstellen'}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Bereits ein Konto?{' '}
                  <Link 
                    to="/login" 
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Hier anmelden
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Was Sie erhalten</CardTitle>
              <CardDescription className="text-blue-700">
                Alle Features, die Sie für professionelle Social Media Posts benötigen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Sofort loslegen
                </h3>
                <p className="text-gray-600">
                  Nach der Registrierung können Sie sofort mit der Erstellung 
                  Ihrer ersten professionellen Social Media Posts beginnen.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">10</div>
                    <div className="text-sm text-gray-600">Posts/Monat</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">4</div>
                    <div className="text-sm text-gray-600">Plattformen</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">∞</div>
                    <div className="text-sm text-gray-600">Möglichkeiten</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage

