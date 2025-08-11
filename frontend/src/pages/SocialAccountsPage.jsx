import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const SocialAccountsPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Social Media Accounts
        </h1>
        <p className="text-gray-600 mt-2">
          Verwalten Sie Ihre verbundenen Social Media Accounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verbundene Accounts</CardTitle>
          <CardDescription>
            Wird in Phase 6 vollständig implementiert
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Hier können Sie bald Ihre Social Media Accounts verwalten.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default SocialAccountsPage

