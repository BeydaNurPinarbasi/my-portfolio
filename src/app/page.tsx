"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FaInstagram, FaLinkedin, FaDownload, FaEnvelope } from "react-icons/fa"; 

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center text-center mt-10">
      
      {/* Arka Plan */}
      <div
        className="absolute inset-0 bg-cover bg-center "
        style={{
          backgroundImage: "url('/Wallpaper_Paris.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "100vh",
          width: "100vw",
          position: "fixed",
          zIndex: -1,
          filter: "blur(4px)", // Daha az bulanıklık için 1px kullan
          WebkitFilter: "blur(2px)", // Safari için de ekle
        }}
      ></div>

      {/* İçerik */}
      <div className="relative z-10 flex items-center space-x-8">
        
        {/* Profil Fotoğrafı */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.div whileTap={{ rotateY: 180 }}>
            <Image
              src="/profil-foto.jpeg"
              alt="Beyda Nur Pınarbaşı"
              width={400}
              height={400}
              className="shadow-lg rounded-lg"
            />
          </motion.div>
        </motion.div>

        {/* Yazılar */}
        <div className="text-left max-w-2xl">
          <h1 className="text-4xl font-serif font-bold text-black mt-4">
            Merhaba, ben Beyda! 👋
          </h1>
          <p className="mt-6 text-xl text-black">
            iOS & Backend Developer | React, Next.js ve modern teknolojilerle projeler geliştiriyorum.
          </p>
          <p className="mt-4 text-md text-black">
            Hayatı kod yazmaktan ibaret teknolojinin olduğu her alanda mutlu oluyor ve yeni yeteneklere ilham vermeyi seviyorum 🚀
          </p>
          <p className="mt-4 text-md text-black italic">
            “Her gün yeni bir satır kod, yeni bir macera!” ☕
          </p>

          {/* Yetenek Kartları */}
          <div className="mt-8 grid grid-cols-2 gap-6 text-base text-white">
            {[
              "💻 iOS & Backend Development",
              "🌍 Dijital Pazarlama & İçerik Üreticisi",
              "🎓 Mentorluk & Eğitmen",
              "🚀 React, Next.js, .NET, React Native"
            ].map((skill, index) => (
              <div
                key={index}
                className="bg-neutral-700 bg-opacity-50 backdrop-blur-lg hover:backdrop-blur-xl hover:bg-purple-700 transition p-3 rounded-lg"
              >
                {skill}
              </div>
            ))}
          </div>

          {/* Butonlar */}
          <div className="mt-8 flex space-x-6">
            <a
              href="/contact"
              className="bg-purple-700 px-6 py-3 rounded-lg text-white hover:bg-purple-300 transition"
            >
              📩 Benimle İletişime Geç
            </a>
            <a   
              href="/projects"
              className="border border-white text-white px-6 py-3 rounded-lg hover:bg-purple-700 hover:border-purple-700 transition flex items-center"
            >
              🚀 Projelerimi Keşfet
            </a>
           <a
              href="/Beyda_Nur_Pinarbasi_CV.pdf"
              download
              className="border border-white text-white px-6 py-3 rounded-lg hover:bg-purple-700 hover:border-purple-700 transition flex items-center"
            >
              <FaDownload className="mr-2 text-lg" /> CV’mi İndir
            </a>
       
          </div>

          {/* Sosyal Medya */}
          <div className="mt-8 flex space-x-6 text-3xl text-white">
            {[
              { href: "https://www.linkedin.com/in/beydanur", icon: <FaLinkedin className="hover:text-blue-700 transition" /> },
              { href: "https://www.instagram.com/cekununzamani", icon: <FaInstagram className="hover:text-red-600 transition" /> },
              { href: "mailto:beydanur.pinarbasi@gmail.com", icon: <FaEnvelope className="hover:text-red-500 transition" /> }
            ].map((social, index) => (
              <a key={index} href={social.href} target="_blank">
                {social.icon}
              </a>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
