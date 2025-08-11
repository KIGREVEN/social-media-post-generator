import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const AdminPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Verwalten Sie Benutzer und System-Einstellungen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Funktionen</CardTitle>
          <CardDescription>
            Wird in Phase 6 vollständig implementiert
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Hier können Sie bald Benutzer und das System verwalten.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminPage

