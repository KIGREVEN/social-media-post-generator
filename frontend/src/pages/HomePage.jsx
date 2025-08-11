import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  PlusCircle, 
  Share2, 
  Zap, 
  Users, 
  BarChart3,
  CheckCircle,
  Wand2
} from 'lucide-react'

const HomePage = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "KI-gestützte Post-Generierung",
      description: "Erstelle professionelle Social Media Posts mit ChatGPT und DALL-E Integration"
    },
    {
      icon: <Share2 className="w-8 h-8 text-green-600" />,
      title: "Multi-Platform Publishing",
      description: "Veröffentliche direkt auf LinkedIn, Facebook, Twitter und Instagram"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "Team-Management",
      description: "Verwalte Benutzer und Rollen mit unserem Admin-Dashboard"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Analytics & Tracking",
      description: "Verfolge deine Post-Performance und Nutzungsstatistiken"
    }
  ]

  const benefits = [
    "Professionelle LinkedIn-Posts in Sekunden",
    "Automatische Bildgenerierung",
    "Direkte Social Media Integration",
    "Benutzer- und Rollenverwaltung",
    "Monatliche Nutzungslimits",
    "Responsive Design für alle Geräte"
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Social Media Posts
            <span className="text-blue-600"> automatisch generieren</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Erstelle professionelle Social Media Inhalte mit KI-Unterstützung. 
            Analysiere Websites, generiere Posts und veröffentliche direkt auf allen Plattformen.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <Link to="/generate">
                <Button size="lg" className="w-full sm:w-auto">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Post erstellen
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Zum Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/simple-generator">
                <Button size="lg" className="w-full sm:w-auto">
                  <Wand2 className="w-5 h-5 mr-2" />
                  Jetzt testen - Ohne Anmeldung!
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Kostenlos registrieren
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                  Anmelden
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">
            Leistungsstarke Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Alles was du brauchst, um professionelle Social Media Posts zu erstellen und zu verwalten.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white rounded-lg p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Warum unser Tool verwenden?
            </h2>
            <p className="text-lg text-gray-600">
              Spare Zeit und erstelle konsistent hochwertige Social Media Inhalte 
              mit unserer KI-gestützten Plattform.
            </p>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Bereit loszulegen?
              </h3>
              <p className="text-gray-600">
                Erstelle deinen ersten professionellen Social Media Post in wenigen Minuten.
              </p>
              {!user && (
                <Link to="/register">
                  <Button className="w-full">
                    Jetzt kostenlos registrieren
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">
            So funktioniert es
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            In nur wenigen Schritten zu professionellen Social Media Posts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold">Website analysieren</h3>
            <p className="text-gray-600">
              Gib die URL der Website ein, die du bewerben möchtest
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold">Post generieren</h3>
            <p className="text-gray-600">
              KI erstellt automatisch professionelle Inhalte basierend auf deinem Thema
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold">Veröffentlichen</h3>
            <p className="text-gray-600">
              Poste direkt auf LinkedIn, Facebook, Twitter oder Instagram
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage

