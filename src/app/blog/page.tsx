"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar } from "lucide-react";

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

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/blog");
      const data = await response.json();
      // Sadece yayınlanmış yazıları göster
      const publishedPosts = data.filter((post: BlogPost) => post.published);
      setPosts(publishedPosts);
    } catch (error) {
      console.error("Blog yazıları yüklenemedi:", error);
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

  // Markdown içeriğini kısalt (satır bazlı)
  const truncateMarkdown = (text: string, maxLines: number = 3): string => {
    if (!text) return "";
    
    const lines = text.split("\n");
    const truncated = lines.slice(0, maxLines).join("\n");
    
    // Eğer içerik kesildiyse "..." ekle
    if (lines.length > maxLines) {
      return truncated + "\n\n...";
    }
    
    return truncated;
  };

  return (
    <section className="min-h-screen py-20 px-4 md:px-10 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Başlık */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">
            Blog
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Teknoloji, yazılım geliştirme ve kişisel düşüncelerim hakkında yazılarım
          </p>
        </div>

        {/* Blog Yazıları */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Henüz Blog Yazısı Yok
            </h2>
            <p className="text-muted-foreground">
              Yakında blog yazıları eklenecek. Tekrar kontrol edin!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer border-border">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[100px] overflow-hidden mb-4">
                      <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: () => null, // Kartlarda başlık gösterme
                            h2: () => null, // Kartlarda başlık gösterme
                            h3: () => null, // Kartlarda başlık gösterme
                            p: ({ node, ...props }) => <p className="mb-1.5 text-sm leading-5 text-muted-foreground line-clamp-2" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-1.5 text-sm space-y-0.5 text-muted-foreground" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-1.5 text-sm space-y-0.5 text-muted-foreground" {...props} />,
                            li: ({ node, ...props }) => <li className="ml-2 text-sm text-muted-foreground" {...props} />,
                            code: ({ node, inline, ...props }: any) => 
                              inline ? (
                                <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-foreground" {...props} />
                              ) : null,
                            pre: () => null,
                            blockquote: ({ node, ...props }) => (
                              <blockquote className="border-l-2 border-primary pl-2 italic text-xs my-2 text-muted-foreground" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                              <a className="text-primary hover:underline text-sm font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                            ),
                            strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
                            em: ({ node, ...props }) => <em className="italic text-muted-foreground" {...props} />,
                          }}
                        >
                          {truncateMarkdown(post.excerpt || post.content, 3)}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <Button variant="link" className="mt-2 p-0 text-primary hover:underline font-medium">
                      Devamını Oku →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
