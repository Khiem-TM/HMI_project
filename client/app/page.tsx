import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center space-y-6 mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to SignLearn
        </h1>
        <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
          Learn sign language interactively with our comprehensive dictionary, 
          translation tools, and practice games.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/dictionary">
            <Button variant="outline" size="lg">
              Explore Dictionary
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Dictionary</CardTitle>
            <CardDescription>
              Search and learn sign language words with videos and descriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dictionary">
              <Button variant="outline" className="w-full">
                Browse Dictionary
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Translator</CardTitle>
            <CardDescription>
              Translate text to sign language or sign language to text
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/translator">
              <Button variant="outline" className="w-full">
                Use Translator
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practice Game</CardTitle>
            <CardDescription>
              Test your knowledge with interactive exercises and games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/game">
              <Button variant="outline" className="w-full">
                Start Practice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

