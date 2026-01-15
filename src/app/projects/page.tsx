"use client";
import React from 'react';
import Image from "next/image";
import { motion } from "framer-motion";
import { FaGithub, FaExternalLinkAlt, FaReact, FaMobileAlt, FaServer, FaGlobe } from "react-icons/fa";
import { SiNextdotjs, SiDotnet, SiMysql, SiTypescript } from "react-icons/si";
import ScrollReveal from "../components/ScrollReveal";

interface Project {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  technologies: string[];
  icons: React.ElementType[];
  githubUrl?: string;
  liveUrl?: string;
  category: "mobile" | "web" | "backend" | "fullstack";
}

const projects: Project[] = [
  {
    id: 1,
    title: "Beyda.dev",
    description: "Kişisel portfolio ve tanıtım web sitesi",
    longDescription: "Modern ve responsive bir portfolio web sitesi. Next.js, shadcn/ui ve Tailwind CSS kullanılarak geliştirildi. Dark mode desteği, animasyonlar ve SEO optimizasyonu içerir.",
    image: "/profile.jpg",
    technologies: [],
    icons: [],
    category: "web",
    liveUrl: "https://beyda.dev",
  },
  {
    id: 2,
    title: "Otel Yönetim Sistemi",
    description: "Modern otel rezervasyon ve yönetim platformu",
    longDescription: "Kapsamlı bir otel yönetim sistemi. Rezervasyon yönetimi, müşteri takibi, oda durumu kontrolü ve raporlama özellikleri içeren full-stack bir uygulama.",
    image: "/Otelproject1.png",
    technologies: ["React", "Next.js", ".NET", "MySQL", "TypeScript"],
    icons: [FaReact, SiNextdotjs, SiDotnet, SiMysql, SiTypescript],
    category: "fullstack",
    githubUrl: "https://github.com/BeydaNurPinarbasi",
  },
  {
    id: 3,
    title: "Mobil Uygulama Projesi",
    description: "React Native ile geliştirilmiş modern mobil uygulama",
    longDescription: "Cross-platform mobil uygulama. iOS ve Android platformlarında çalışan, performanslı ve kullanıcı dostu bir React Native projesi.",
    image: "/Otelproject2.png",
    technologies: ["React Native", "TypeScript", "Firebase"],
    icons: [FaMobileAlt, SiTypescript],
    category: "mobile",
    githubUrl: "https://github.com/BeydaNurPinarbasi",
  },
];

const categoryColors = {
  mobile: "bg-slate-600",
  web: "bg-slate-700",
  backend: "bg-slate-800",
  fullstack: "bg-gradient-to-r from-slate-600 to-slate-800",
};

const categoryLabels = {
  mobile: "Mobil",
  web: "Web",
  backend: "Backend",
  fullstack: "Full Stack",
};

export default function Projects() {
  return (
    <section className="min-h-screen py-20 px-4 md:px-10 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Başlık */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-foreground">
              Projelerim
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Geliştirdiğim projeleri keşfedin. Her proje, modern teknolojiler ve en iyi pratiklerle oluşturulmuştur.
            </p>
          </div>
        </ScrollReveal>

        {/* Projeler Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {projects.map((project, index) => (
            <ScrollReveal key={project.id} delay={index * 0.2}>
              <motion.div
                whileHover={{ y: -10 }}
                className="bg-card rounded-xl shadow-lg border border-border overflow-hidden transition-all duration-300 hover:shadow-2xl"
              >
                {/* Proje Görseli */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${categoryColors[project.category]}`}>
                      {categoryLabels[project.category]}
                    </span>
                  </div>
                </div>

                {/* Proje İçeriği */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {project.description}
                  </p>
                  <p className="text-sm text-muted-foreground/80 mb-6">
                    {project.longDescription}
                  </p>

                  {/* Teknolojiler */}
                  {project.technologies.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-foreground mb-3">
                        Kullanılan Teknolojiler:
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {project.technologies.map((tech, techIndex) => {
                          const Icon = project.icons[techIndex] || FaReact;
                          return (
                            <div
                              key={techIndex}
                              className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-lg text-sm"
                            >
                              <Icon className="text-lg text-foreground" />
                              <span className="text-foreground">{tech}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Linkler */}
                  <div className="flex gap-4">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <FaGithub />
                        <span>GitHub</span>
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      >
                        <FaExternalLinkAlt />
                        <span>Canlı Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Daha Fazla Proje Mesajı */}
        <ScrollReveal delay={0.6}>
          <div className="text-center mt-16 p-8 bg-card rounded-xl border border-border">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Daha Fazla Proje
            </h3>
            <p className="text-muted-foreground mb-6">
              Tüm projelerimi GitHub'da inceleyebilirsiniz
            </p>
            <a
              href="https://github.com/BeydaNurPinarbasi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FaGithub size={20} />
              <span>GitHub Profilimi Ziyaret Et</span>
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

