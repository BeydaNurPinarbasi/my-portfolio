"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import ScrollReveal from "@/app/components/ScrollReveal";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch("/api/blog");
      const data = await response.json();
      const foundPost = data.find((p: BlogPost) => p.slug === slug && p.published);

      if (foundPost) {
        setPost(foundPost);
      } else {
        setError("Blog yazısı bulunamadı");
      }
    } catch (err) {
      setError("Blog yazısı yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="min-h-screen py-20 px-4 md:px-10 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="min-h-screen py-20 px-4 md:px-10 bg-background">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Blog Yazısı Bulunamadı
              </h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link href="/blog">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Blog Sayfasına Dön
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen py-20 px-4 md:px-10 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Geri Dön Butonu */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Blog Sayfasına Dön
          </Button>
        </Link>

        <ScrollReveal>
          <article>
            {/* Başlık */}
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.createdAt}>
                    {formatDate(post.createdAt)}
                  </time>
                </div>
              </div>
            </header>

            {/* İçerik */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-a:text-primary prose-li:text-foreground prose-blockquote:text-foreground">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 text-foreground" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-5 mb-3 text-foreground" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-4 leading-7 text-foreground" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-foreground" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground" {...props} />,
                      li: ({ node, ...props }) => <li className="ml-4 text-foreground" {...props} />,
                      code: ({ node, inline, ...props }: any) => 
                        inline ? (
                          <code className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props} />
                        ) : (
                          <code className="block bg-secondary p-4 rounded-lg overflow-x-auto text-sm font-mono text-foreground my-4" {...props} />
                        ),
                      pre: ({ node, ...props }) => <pre className="bg-secondary p-4 rounded-lg overflow-x-auto my-4" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                      ),
                      strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
                      em: ({ node, ...props }) => <em className="italic text-foreground" {...props} />,
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Alt Bilgi */}
            <div className="mt-8 pt-8 border-t border-border">
              <Link href="/blog">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tüm Yazılara Dön
                </Button>
              </Link>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  );
}
