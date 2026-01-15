"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, FileText, FolderKanban, Mail } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Toplam Blog Yazısı",
      value: "0",
      description: "Yayınlanan blog yazıları",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Toplam Proje",
      value: "3",
      description: "Portfolio projeleri",
      icon: FolderKanban,
      color: "text-green-600",
    },
    {
      title: "Mesajlar",
      value: "0",
      description: "Gelen iletişim mesajları",
      icon: Mail,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Admin paneline hoş geldiniz. Buradan içeriklerinizi yönetebilirsiniz.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hızlı Erişim</CardTitle>
          <CardDescription>Yönetim sayfalarına hızlı erişim</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
              <h3 className="font-semibold text-foreground mb-2">Blog Yönetimi</h3>
              <p className="text-sm text-muted-foreground">
                Blog yazılarını ekleyin, düzenleyin veya silin
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
              <h3 className="font-semibold text-foreground mb-2">Proje Yönetimi</h3>
              <p className="text-sm text-muted-foreground">
                Portfolio projelerinizi yönetin
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
