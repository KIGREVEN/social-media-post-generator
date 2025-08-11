import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PostsPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Meine Posts
        </h1>
        <p className="text-gray-600 mt-2">
          Verwalten Sie Ihre erstellten Social Media Posts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts Übersicht</CardTitle>
          <CardDescription>
            Wird in Phase 6 vollständig implementiert
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Hier sehen Sie bald alle Ihre erstellten Posts.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default PostsPage

