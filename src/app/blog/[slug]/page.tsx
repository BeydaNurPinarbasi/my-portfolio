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
      // Slug'a göre direkt endpoint kullan (daha hızlı)
      const response = await fetch(`/api/blog/${slug}`);
      
      if (response.ok) {
        const data = await response.json();
        setPost(data);
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
      <section className="min-h-screen py-8 sm:py-12 md:py-20 px-4 sm:px-6 md:px-10 bg-background">
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
      <section className="min-h-screen py-8 sm:py-12 md:py-20 px-4 sm:px-6 md:px-10 bg-background">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 px-4 sm:px-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                Blog Yazısı Bulunamadı
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">{error}</p>
              <Link href="/blog">
                <Button className="text-sm sm:text-base">
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
    <section className="min-h-screen py-8 sm:py-12 md:py-20 px-4 sm:px-6 md:px-10 bg-background">
      <div className="max-w-4xl mx-auto w-full">
        {/* Geri Dön Butonu */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-6 sm:mb-8 text-sm sm:text-base">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Blog Sayfasına Dön</span>
            <span className="sm:hidden">Geri</span>
          </Button>
        </Link>

        <ScrollReveal>
          <article className="w-full overflow-hidden">
            {/* Başlık */}
            <header className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-foreground break-words">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <time dateTime={post.createdAt}>
                    {formatDate(post.createdAt)}
                  </time>
                </div>
              </div>
            </header>

            {/* İçerik */}
            <Card className="border-border w-full overflow-hidden">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-a:text-primary prose-li:text-foreground prose-blockquote:text-foreground w-full overflow-x-hidden break-words">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl sm:text-3xl font-bold mt-4 sm:mt-6 mb-3 sm:mb-4 text-foreground break-words" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl sm:text-2xl font-bold mt-4 sm:mt-5 mb-2 sm:mb-3 text-foreground break-words" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg sm:text-xl font-semibold mt-3 sm:mt-4 mb-2 text-foreground break-words" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-3 sm:mb-4 leading-6 sm:leading-7 text-sm sm:text-base text-foreground break-words" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 sm:mb-4 space-y-1 sm:space-y-2 text-sm sm:text-base text-foreground pl-2 sm:pl-0" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 sm:mb-4 space-y-1 sm:space-y-2 text-sm sm:text-base text-foreground pl-2 sm:pl-0" {...props} />,
                      li: ({ node, ...props }) => <li className="ml-2 sm:ml-4 text-foreground break-words" {...props} />,
                      code: ({ node, inline, ...props }: any) => 
                        inline ? (
                          <code className="bg-secondary px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono text-foreground break-words" {...props} />
                        ) : (
                          <code className="block bg-secondary p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono text-foreground my-3 sm:my-4 w-full" {...props} />
                        ),
                      pre: ({ node, ...props }) => <pre className="bg-secondary p-3 sm:p-4 rounded-lg overflow-x-auto my-3 sm:my-4 w-full text-xs sm:text-sm" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-primary pl-3 sm:pl-4 italic my-3 sm:my-4 text-sm sm:text-base text-muted-foreground break-words" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a className="text-primary hover:underline break-words" target="_blank" rel="noopener noreferrer" {...props} />
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
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
              <Link href="/blog">
                <Button variant="outline" className="text-sm sm:text-base w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Tüm Yazılara Dön</span>
                  <span className="sm:hidden">Geri Dön</span>
                </Button>
              </Link>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  );
}
