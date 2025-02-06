"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FaInstagram, FaLinkedin, FaDownload, FaEnvelope } from "react-icons/fa"; // İkonlar eklendi

export default function Home() {
  return (
    <div className="text-center mt-10 flex flex-col items-center">
      <div className="flex items-center space-x-8">
        
        {/* Profil Fotoğrafı - Animasyonlu */}
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
          <p className="mt-6 text-xl text-stone-900">
            iOS & Backend Developer | React, Next.js ve modern teknolojilerle projeler geliştiriyorum.
          </p>
          <p className="mt-4 text-md text-stone-900">
            Hayatı kod yazmaktan ibaret teknolojinin olduğu her alanda mutlu oluyor ve yeni yeteneklere ilham vermeyi seviyor🚀
          </p>
          <p className="mt-4 text-md text-stone-900 italic">
            “Her gün yeni bir satır kod, yeni bir macera!” ☕
          </p>

           {/* Uzmanlık Alanları */}
            <div className="mt-8 grid grid-cols-2 gap-6 text-base text-gray-700">
              <div className="bg-gray-100 p-3 rounded-lg">💻 iOS & Backend Development</div>
              <div className="bg-gray-100 p-3 rounded-lg">🌍 Dijital Pazarlama & İçerik Üreticisi</div>
              <div className="bg-gray-100 p-3 rounded-lg">🎓 Mentorluk & Eğitmen</div>
              <div className="bg-gray-100 p-3 rounded-lg">🚀 React, Next.js, .NET, React Native</div>
            </div>

          {/* Butonlar */}
          <div className="mt-8 flex space-x-6">
          <a
            href="/projects"
            className="bg-purple-700 text-white px-6 py-3 rounded-lg hover:bg-purple-300 transition"
          >
            🚀 Projelerimi Keşfet
          </a>

            <a
              href="/contact"
              className="border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition"
            >
              📩 Benimle İletişime Geç
            </a>
            <a
              href="/Beyda_Nur_Pinarbasi_CV.pdf" // CV'ni public klasörüne ekle!
              download
              className="flex items-center border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition"
            >
              <FaDownload className="mr-2" /> CV’mi İndir
            </a>
          </div>

          {/* Sosyal Medya İkonları */}
          <div className="mt-8 flex space-x-6 text-3xl text-gray-700">
            <a href="https://www.linkedin.com/in/beydanur" target="_blank">
              <FaLinkedin className="hover:text-blue-700 transition" />
            </a>
            <a href="https://www.instagram.com/cekununzamani" target="_blank">
              <FaInstagram className="hover:text-red-600 transition" />
            </a>
            {/* Gmail İkonu */}
            <a href="mailto:beydanur.pinarbasi@gmail.com" target="_blank">
              <FaEnvelope className="hover:text-red-500 transition" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
