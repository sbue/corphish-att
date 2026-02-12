import { Button } from '@corphish/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@corphish/ui/components/card'
import { getGreeting } from '@/lib/trpc/server'

export default async function HomePage() {
  const greeting = await getGreeting('world')

  return (
    <main className='flex min-h-screen items-center justify-center p-6'>
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle>Hello world</CardTitle>
          <CardDescription>Next.js + shadcn + tRPC + Nest + Prisma template</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>{greeting.message}</p>
        </CardContent>
        <CardFooter>
          <Button>Boilerplate Ready</Button>
        </CardFooter>
      </Card>
    </main>
  )
}
