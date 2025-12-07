"use client";
import Image from "next/image";
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
import TypingAnimation from "./components/TypingAnimation";
import ScrollReveal from "./components/ScrollReveal";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center text-center mt-10 px-4 md:px-10">
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
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 bg-opacity-55 dark:bg-opacity-75 transition-colors duration-300"></div>
      </div>

      {/* İçerik */}
      <div className="min-h-screen relative z-10 flex flex-col md:flex-row items-center mt-20 md:mt-10 space-y-6 md:space-x-8 md:space-y-0">
        {/* Profil Fotoğrafı */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.div whileTap={{ rotateY: 180 }}>
            <Image
              src="/profile.jpg"
              alt="Beyda Nur Pınarbaşı"
              width={250}
              height={250}
              className="shadow-lg rounded-lg w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] md:w-[400px] md:h-[400px] mt-6 md:mt-0"
            />
          </motion.div>
        </motion.div>

        {/* Yazılar */}
        <div className="text-left max-w-md md:max-w-2xl">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif text-black dark:text-white">
              {" "}
              Merhaba ben{" "}
            </h2>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-500 inline-block text-transparent bg-clip-text drop-shadow-lg">
              <TypingAnimation 
                words={["Beyda Nur", "iOS Developer", "Backend Developer", "Full Stack"]}
                className="inline-block"
              />
            </h2>
          </div>

          <ScrollReveal>
            <p className="text-lg font-serif font-medium text-black dark:text-gray-300">
              💻iOS & Backend Developer | React, React Native ile modern teknolojilerle projeler geliştiriyorum.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="mt-4 text-md font-serif text-black dark:text-gray-300 italic">
              &ldquo;Her gün yeni bir satır kod, yeni bir macera!&rdquo; ☕
            </p>
          </ScrollReveal>

          {/* Yetenekler */}
          <div className="mt-6 space-y-6">
            <ScrollReveal delay={0.3}>
              <div>
                <p className="text-black dark:text-gray-300 font-serif">
                  Çeşitli kurumlarda mentorluk yaparak öğrencilere rehberlik
                  ediyorum.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              <div>
                <p className="text-black dark:text-gray-300 font-serif">
                  Modern frontend teknolojileri ile dinamik ve performanslı mobil
                  uygulamalar geliştiriyorum.
                </p>
              </div>
            </ScrollReveal>
          </div>
          <div className="mt-6 flex flex-wrap justify-start space-x-4 space-y-4 md:space-y-0">
            <a
              href="/contact"
              className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 rounded-lg text-white font-semibold hover:shadow-lg transition-all duration-300"
            >
              📩 Benimle İletişime Geç
            </a>
            <a
              href="/Beyda_Nur_Pinarbasi_CV.pdf"
              download
              className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-3 rounded-lg text-white font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              📄 CV İndir
            </a>
            <a
              href="/projects"
              className="bg-gradient-to-r from-blue-600 to-purple-500 px-6 py-3 rounded-lg text-white font-semibold hover:shadow-lg transition-all duration-300"
            >
              🚀 Projelerim
            </a>
          </div>

          {/* Sosyal Medya */}
          <div className="mt-6 flex space-x-6 text-3xl text-slate-950 justify-start">
            {[
              {
                href: "https://www.linkedin.com/in/beyda-nur-p%C4%B1narba%C5%9F%C4%B1/",
                icon: <FaLinkedin className="hover:text-blue-700 transition" />,
              },
              {
                href: "https://www.instagram.com/cekununzamani",
                icon: <FaInstagram className="hover:text-red-600 transition" />,
              },
              {
                href: "mailto:beydanur.pinarbasi@gmail.com",
                icon: <FaEnvelope className="hover:text-red-500 transition" />,
              },
            ].map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="p-3 rounded-full bg-transparent border-2 border-gray-300 hover:bg-gray-200 transition">
                  {social.icon}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* İstatistikler Bölümü */}
      <div className="relative z-10 w-full max-w-6xl mx-auto mt-20 mb-20 px-4">
        <ScrollReveal>
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black dark:text-white">
            İstatistiklerim
          </h3>
        </ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            {
              icon: FaProjectDiagram,
              number: "50+",
              label: "Tamamlanan Proje",
              color: "from-purple-500 to-purple-700",
            },
            {
              icon: FaCode,
              number: "3+",
              label: "Yıl Deneyim",
              color: "from-blue-500 to-blue-700",
            },
            {
              icon: FaUsers,
              number: "10+",
              label: "Mentorluk Yapılan Öğrenci",
              color: "from-green-500 to-green-700",
            },
            {
              icon: FaAward,
              number: "100%",
              label: "Müşteri Memnuniyeti",
              color: "from-orange-500 to-orange-700",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg text-center border border-gray-200 dark:border-gray-700"
                >
                  <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${stat.color} mb-4`}>
                    <Icon className="text-white text-2xl" />
                  </div>
                  <h4 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.number}
                  </h4>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </p>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
