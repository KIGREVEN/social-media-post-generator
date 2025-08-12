import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, 
  LogOut, 
  Settings, 
  PlusCircle, 
  FileText, 
  Share2,
  Shield,
  Lightbulb
} from 'lucide-react'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Social Media Post Generator
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Authenticated Navigation */}
                <div className="hidden md:flex items-center space-x-4">
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/planner">
                    <Button variant="ghost" size="sm">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Content-Planner
                    </Button>
                  </Link>
                  <Link to="/scheduler">
                    <Button variant="ghost" size="sm">
                      📅 Post-Planer
                    </Button>
                  </Link>
                  <Link to="/generate">
                    <Button variant="ghost" size="sm">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Post erstellen
                    </Button>
                  </Link>
                  <Link to="/posts">
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Meine Posts
                    </Button>
                  </Link>
                  <Link to="/social-accounts">
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Accounts
                    </Button>
                  </Link>
                  {isAdmin() && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.username}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {/* Mobile Navigation Links */}
                    <div className="md:hidden">
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="w-full">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/planner" className="w-full">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Content-Planner
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/scheduler" className="w-full">
                          📅 Post-Planer
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/generate" className="w-full">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Post erstellen
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/posts" className="w-full">
                          <FileText className="w-4 h-4 mr-2" />
                          Meine Posts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/social-accounts" className="w-full">
                          <Share2 className="w-4 h-4 mr-2" />
                          Accounts
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin() && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="w-full">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                    </div>

                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Einstellungen</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Abmelden</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Unauthenticated Navigation */}
                <Link to="/login">
                  <Button variant="ghost">
                    Anmelden
                  </Button>
                </Link>
                <Link to="/register">
                  <Button>
                    Registrieren
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

