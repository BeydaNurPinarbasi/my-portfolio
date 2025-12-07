"use client";
import React from 'react';
import { FaReact, FaJs, FaBootstrap, FaGitAlt } from "react-icons/fa";
import { SiTypescript, SiTailwindcss, SiDotnet, SiMysql, SiNextdotjs } from "react-icons/si";
import { TbBrandCSharp } from "react-icons/tb";
import Image from "next/image";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { Engine } from "tsparticles-engine";
import SkillsProgress from "../components/SkillsProgress";
import Timeline from "../components/Timeline";
import ScrollReveal from "../components/ScrollReveal";

const skills = [
  { name: "React", icon: FaReact, bg: "bg-gray-700 text-blue-500" },
  { name: "React Native", icon: FaReact, bg: "bg-zinc-950 text-blue-500" },
  { name: "JavaScript", icon: FaJs, bg: "bg-yellow-500 text-black" },
  { name: "TypeScript", icon: SiTypescript, bg: "bg-blue-600 text-white" },
  { name: "C#", icon: TbBrandCSharp, bg: "bg-gray-700 text-white" },
  { name: ".NET", icon: SiDotnet, bg: "bg-purple-700 text-white" },
  { name: "TailwindCSS", icon: SiTailwindcss, bg: "bg-teal-500 text-white" },
  { name: "Bootstrap", icon: FaBootstrap, bg: "bg-purple-500 text-white" },
  { name: "Next.js", icon: SiNextdotjs, bg: "bg-indigo-700 text-white" },
  { name: "MySQL", icon: SiMysql, bg: "bg-blue-700 text-white" },
  { name: "Git & GitHub", icon: FaGitAlt, bg: "bg-orange-500 text-white" }
].filter(skill => skill.icon !== null && skill.icon !== undefined);

const SkillCard: React.FC<{ name: string; icon?: React.ElementType; bg: string }> = ({ name, icon: Icon, bg }) => (
  <div 
    className={`p-4 sm:p-6 rounded-xl text-center shadow-lg h-28 sm:h-32 md:h-36 w-full max-w-[140px] sm:max-w-[160px] md:w-40 md:max-w-[176px] transition-all duration-500 transform hover:scale-110 hover:shadow-2xl hover:brightness-125 hover:bg-opacity-80 ${bg} flex flex-col items-center justify-center border border-gray-500 dark:border-gray-400 hover:border-white dark:hover:border-gray-200 hover:rotate-1`}
  >
    {Icon ? <Icon className="text-3xl sm:text-4xl md:text-5xl drop-shadow-xl" /> : <span className="text-3xl sm:text-4xl md:text-5xl">⚠️</span>}
    <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-lg font-semibold drop-shadow-md text-white break-words">{name}</p>
  </div>
);

const progressSkills = [
  { name: "React & React Native", percentage: 90, color: "bg-blue-500" },
  { name: "TypeScript", percentage: 85, color: "bg-blue-600" },
  { name: "Next.js", percentage: 80, color: "bg-indigo-600" },
  { name: "C# & .NET", percentage: 85, color: "bg-purple-600" },
  { name: "JavaScript", percentage: 90, color: "bg-yellow-500" },
  { name: "MySQL", percentage: 75, color: "bg-blue-700" },
];

const timelineData = [
  {
    type: "work" as const,
    title: "Yazılım Geliştirici",
    organization: "Astro Dijital Yazılım",
    period: "Ekim 2025 - Günümüz",
    description: "Dijital yazılım çözümleri geliştiriyorum. Modern teknolojiler kullanarak projeler üretiyorum.",
  },
  {
    type: "work" as const,
    title: "Yazılım Geliştirici",
    organization: "İzmir Yazılım",
    period: "Şubat 2025 - Ağustos 2025",
    description: "Yazılım geliştirme projelerinde yer aldım. Çeşitli teknolojiler ile uygulamalar geliştirdim.",
  },
  {
    type: "work" as const,
    title: "iOS & Backend Developer",
    organization: "Siliconmade R&D, İstanbul, Türkiye (Uzaktan)",
    period: "Mart 2023 - Ocak 2025",
    description: "iOS ve backend geliştirme projelerinde aktif olarak çalıştım. React Native ve .NET teknolojileri ile modern uygulamalar geliştirdim.",
  },
  {
    type: "work" as const,
    title: "Sosyal Medya İçerik Üreticisi",
    organization: "KORNİŞON AJANS, İzmir, Türkiye",
    period: "Ekim 2022 - Ocak 2023",
    description: "Ajans bünyesinde sosyal medya içerik üretimi ve yönetimi yaptım. Markalar için yaratıcı içerikler hazırladım.",
  },
  {
    type: "work" as const,
    title: "Stajyer",
    organization: "İzmir Aile, Çalışma ve Sosyal Hizmetler İl Müdürlüğü",
    period: "Temmuz 2019 - Eylül 2019",
    description: "Kamu kurumunda staj yaptım ve yazılım süreçlerine dahil oldum.",
  },
  {
    type: "education" as const,
    title: "Sosyoloji",
    organization: "Dokuz Eylül Üniversitesi (DEÜ)",
    period: "Mezun - 2022",
    description: "Dokuz Eylül Üniversitesi Sosyoloji bölümünden mezun oldum.",
  },
];

const About: React.FC = () => {
  const particlesInit = async (main: Engine) => {
    await loadSlim(main);
  };

  return (
    <section id="about" className="py-20 px-6 relative text-white dark:text-gray-100 overflow-hidden">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          particles: {
            number: { value: 80 },
            size: { value: 3 },
            move: { enable: true, speed: 1 },
            shape: { type: "circle" },
            opacity: { value: 0.5 }
          },
          interactivity: {
            events: { onHover: { enable: true, mode: "repulse" } },
          }
        }}
        className="absolute top-0 left-0 w-full h-full z-0"
      />
      <div className="relative max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
        <ScrollReveal>
          <div className="text-center md:text-left">
            <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-blue-500 inline-block text-transparent bg-clip-text drop-shadow-lg">About Me</h2>
            <p className="text-lg mb-8 leading-relaxed text-gray-900 dark:text-gray-100 drop-shadow-md">
              Merhaba, ben Beyda Nur Pınarbaşı. iOS ve Backend Developer olarak kariyerime devam ediyorum. Şu anda <span className="text-purple-400 dark:text-purple-300 font-semibold">Astro Dijital Yazılım</span>&apos;de aktif olarak çalışıyorum. 
               Mentorluk yapıyorum ve çeşitli organizasyonlarda bilgi paylaşımında bulunuyorum bu sayede yeni yeteneklerin gelişimine katkı sağlamaktan büyük keyif alıyorum.
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal direction="right">
          <div className="flex justify-center">
            <Image src="/profile.jpg" alt="Beyda Nur Pınarbaşı" width={250} height={250} className="rounded-full shadow-2xl border-4 border-purple-500 dark:border-purple-400 hover:shadow-purple-500 transition-all duration-500 transform hover:scale-105" />
          </div>
        </ScrollReveal>
      </div>
      
      <div className="relative max-w-5xl mx-auto mt-16 z-10">
        <ScrollReveal>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 drop-shadow-lg text-center">Skills Progress</h3>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-xl shadow-lg">
            <SkillsProgress skills={progressSkills} />
          </div>
        </ScrollReveal>
      </div>

      <div className="relative max-w-5xl mx-auto text-center mt-16 z-10">
        <ScrollReveal>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 drop-shadow-lg">My Skills</h3>
        </ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-10 justify-center">
          {skills.map((skill, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <SkillCard {...skill} />
            </ScrollReveal>
          ))}
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto mt-20 z-10">
        <ScrollReveal>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 drop-shadow-lg text-center">Experience & Education</h3>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-xl shadow-lg">
            <Timeline items={timelineData} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default About;
