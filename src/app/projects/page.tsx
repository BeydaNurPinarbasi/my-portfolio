"use client";
import React from "react";
import ProjectCard from "../components/ProjectCard";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { Engine } from "tsparticles-engine";

const projects = [
  {
    title: "Firebase Depo Yönetim",
    description: "Firebase kullanarak oluşturduğum depo yönetim sistemi.",
    link: "https://github.com/beydanp/firebase-depo",
  },
  {
    title: "React Native Search",
    description: "React Native ile geliştirdiğim arama uygulaması.",
    link: "https://github.com/beydanp/react-native-search",
  },
  {
    title: "Mobil Uygulama Projesi",
    description: "React Native ile oluşturduğum mobil uygulama.",
    link: "https://github.com/beydanp/react-native-search",
  },
];

export default function ProjectsPage() {
  const particlesInit = async (main: Engine) => {
    await loadSlim(main);
  };

  return (
    <section className="relative py-20 px-6 text-gray-950 overflow-hidden">
      {/* Arka Plan Efekti */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          particles: {
            number: { value: 50 },
            size: { value: 3 },
            move: { enable: true, speed: 0.6 },
            shape: { type: "circle" },
            opacity: { value: 0.3 },
          },
          interactivity: {
            events: { onHover: { enable: true, mode: "repulse" } },
          },
        }}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      <div className="relative max-w-5xl mx-auto text-center z-10">
        {/* Başlık */}
        <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-blue-500 text-transparent bg-clip-text drop-shadow-lg">
          My Projects
        </h2>
        <p className="text-lg text-gray-900 mb-12 drop-shadow-md">
          İşte geliştirdiğim bazı projeler. Daha fazla detay için GitHub&apos;ımı ziyaret edebilirsin! 🚀
        </p>

        {/* Proje Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {projects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
}
