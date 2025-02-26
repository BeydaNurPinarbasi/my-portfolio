"use client";
import React from 'react';
import { FaReact, FaJs, FaBootstrap, FaGitAlt } from "react-icons/fa";
import { SiTypescript, SiTailwindcss, SiDotnet, SiMysql, SiNextdotjs } from "react-icons/si";
import { TbBrandCSharp } from "react-icons/tb";
import Image from "next/image";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { Engine } from "tsparticles-engine";

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
    className={`p-6 rounded-xl text-center shadow-lg h-36 w-40 md:w-44 transition-all duration-500 transform hover:scale-110 hover:shadow-2xl hover:brightness-125 hover:bg-opacity-80 ${bg} flex flex-col items-center justify-center border border-gray-500 hover:border-white hover:rotate-1`}
  >
    {Icon ? <Icon className="text-5xl drop-shadow-xl" /> : <span className="text-5xl">⚠️</span>}
    <p className="mt-3 text-lg font-semibold drop-shadow-md text-white">{name}</p>
  </div>
);

const About: React.FC = () => {
  const particlesInit = async (main: Engine) => {
    await loadSlim(main);
  };

  return (
    <section id="about" className="py-20 px-6 relative text-white overflow-hidden">
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
        <div className="text-center md:text-left">
          <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-blue-500 inline-block text-transparent bg-clip-text drop-shadow-lg">About Me</h2>
          <p className="text-lg mb-8 leading-relaxed text-gray-900 drop-shadow-md">
            Merhaba, ben Beyda Nur Pınarbaşı. iOS ve Backend Developer olarak kariyerime devam ediyorum. Şu anda <span className="text-purple-400 font-semibold">Siliconmade R&D</span>'de aktif olarak çalışıyor, aynı zamanda freelance projelerle kendimi sürekli geliştiriyorum. 
            Yazılımın yanı sıra pazarlama ve sosyal medya alanlarına olan ilgim, projelerde geniş bir perspektif kazanmamı sağlıyor. Mentorluk yapıyorum ve çeşitli organizasyonlarda bilgi paylaşımında bulunuyorum bu sayede yeni yeteneklerin gelişimine katkı sağlamaktan büyük keyif alıyorum.
          </p>
        </div>
        <div className="flex justify-center">
          <Image src="/profile.jpg" alt="Beyda Nur Pınarbaşı" width={250} height={250} className="rounded-full shadow-2xl border-4 border-purple-500 hover:shadow-purple-500 transition-all duration-500 transform hover:scale-105" />
        </div>
      </div>
      <div className="relative max-w-5xl mx-auto text-center mt-16 z-10">
        <h3 className="text-4xl font-bold text-gray-900 mb-6 drop-shadow-lg">My Skills</h3>
        <div className="grid grid-cols-2 md-grid-cols-3 lg:grid-cols-4 gap-10 justify-center">
          {skills.map((skill, index) => (
            <SkillCard key={index} {...skill} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
