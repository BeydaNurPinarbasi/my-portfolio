"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaInstagram,
  FaLinkedin,
  FaEnvelope,
  FaCode,
  FaProjectDiagram,
  FaUsers,
  FaAward,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TypingAnimation from "./components/TypingAnimation";
import ScrollReveal from "./components/ScrollReveal";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center text-center mt-20 md:mt-10 px-4 md:px-10">
      {/* Arka Plan */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/Wallpaper_Paris.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "100vh",
          width: "100vw",
          position: "fixed",
          zIndex: -1,
          filter: "blur(2px)",
          WebkitFilter: "blur(2px)",
        }}
      >
        <div className="absolute inset-0 bg-background/60 dark:bg-background/80 transition-colors duration-300"></div>
      </div>

      {/* İçerik */}
      <div className="min-h-screen relative z-10 flex flex-col md:flex-row items-center justify-center space-y-8 md:space-x-12 md:space-y-0 py-12">
        {/* Profil Fotoğrafı */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-shrink-0"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
              <Image
                src="/profile.jpg"
                alt="Beyda Nur Pınarbaşı"
                width={300}
                height={300}
                className="relative rounded-2xl shadow-2xl border-4 border-background w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] object-cover"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Yazılar */}
        <div className="text-left max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground">
                Merhaba, ben
              </h1>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground">
                <TypingAnimation 
                  words={["Beyda Nur", "iOS Developer", "Backend Developer", "Full Stack"]}
                  className="inline-block"
                />
              </h1>
            </div>

            <ScrollReveal>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                💻 iOS & Backend Developer | React, React Native ile modern teknolojilerle projeler geliştiriyorum.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-base md:text-lg text-muted-foreground italic">
                &ldquo;Her gün yeni bir satır kod, yeni bir macera!&rdquo; ☕
              </p>
            </ScrollReveal>
          </motion.div>

          {/* Yetenekler */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-4"
          >
            <ScrollReveal delay={0.3}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="pt-6">
                  <p className="text-foreground">
                    🎓 Çeşitli kurumlarda mentorluk yaparak öğrencilere rehberlik ediyorum.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="pt-6">
                  <p className="text-foreground">
                    🚀 Modern frontend teknolojileri ile dinamik ve performanslı mobil uygulamalar geliştiriyorum.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </motion.div>

          {/* Butonlar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <Button asChild size="lg" className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white">
              <Link href="/contact">
                📩 Benimle İletişime Geç
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2">
              <Link href="/projects">
                🚀 Projelerim
              </Link>
            </Button>
          </motion.div>

          {/* Sosyal Medya */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex gap-4"
          >
            {[
              {
                href: "https://www.linkedin.com/in/beyda-nur-p%C4%B1narba%C5%9F%C4%B1/",
                icon: <FaLinkedin className="h-5 w-5" />,
                label: "LinkedIn",
                color: "hover:text-blue-600",
              },
              {
                href: "https://www.instagram.com/cekununzamani",
                icon: <FaInstagram className="h-5 w-5" />,
                label: "Instagram",
                color: "hover:text-slate-600 dark:hover:text-slate-400",
              },
              {
                href: "mailto:beydanur.pinarbasi@gmail.com",
                icon: <FaEnvelope className="h-5 w-5" />,
                label: "Email",
                color: "hover:text-red-600",
              },
            ].map((social, index) => (
              <Button
                key={index}
                variant="outline"
                size="icon"
                asChild
                className={cn("rounded-full border-2", social.color)}
              >
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              </Button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* İstatistikler Bölümü */}
      <section className="relative z-10 w-full max-w-7xl mx-auto mt-32 mb-20 px-4">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
            İstatistiklerim
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Kariyerim boyunca elde ettiğim başarılar
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: FaProjectDiagram,
              number: "50+",
              label: "Tamamlanan Proje",
              description: "Başarıyla tamamlanan projeler",
              gradient: "from-slate-600 to-slate-800",
              bgGradient: "from-slate-500/10 to-slate-700/10",
            },
            {
              icon: FaCode,
              number: "3+",
              label: "Yıl Deneyim",
              description: "Yazılım geliştirme deneyimi",
              gradient: "from-blue-500 to-blue-700",
              bgGradient: "from-blue-500/10 to-blue-700/10",
            },
            {
              icon: FaUsers,
              number: "10+",
              label: "Mentorluk Yapılan Öğrenci",
              description: "Rehberlik ettiğim öğrenciler",
              gradient: "from-green-500 to-green-700",
              bgGradient: "from-green-500/10 to-green-700/10",
            },
            {
              icon: FaAward,
              number: "100%",
              label: "Müşteri Memnuniyeti",
              description: "Memnun kalan müşteriler",
              gradient: "from-orange-500 to-orange-700",
              bgGradient: "from-orange-500/10 to-orange-700/10",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal key={index} delay={index * 0.1}>
                <motion.div whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.2 }}>
                  <Card className={cn(
                    "h-full border-2 bg-card/80 backdrop-blur-sm transition-all duration-300",
                    `bg-gradient-to-br ${stat.bgGradient}`
                  )}>
                    <CardHeader className="text-center pb-3">
                      <div className={cn(
                        "inline-flex p-4 rounded-full bg-gradient-to-r mb-4",
                        `bg-gradient-to-r ${stat.gradient}`
                      )}>
                        <Icon className="text-white text-2xl" />
                      </div>
                      <CardTitle className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                        {stat.number}
                      </CardTitle>
                      <CardDescription className="text-base md:text-lg font-semibold text-foreground">
                        {stat.label}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <p className="text-sm text-muted-foreground">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
