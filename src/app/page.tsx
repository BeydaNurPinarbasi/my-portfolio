"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaInstagram,
  FaLinkedin,
  FaDownload,
  FaEnvelope,
} from "react-icons/fa";

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
        {/* Buraya ekleyebilirsin */}
        <div className="absolute inset-0 bg-gray-50 bg-opacity-55"></div>
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
              src="/profil-foto.jpeg"
              alt="Beyda Nur Pınarbaşı"
              width={250}
              height={250}
              className="shadow-lg rounded-lg md:w-[400px] md:h-[400px] mt-6 md:mt-0"
            />
          </motion.div>
        </motion.div>

        {/* Yazılar */}
        <div className="text-left max-w-md md:max-w-2xl">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl md:text-5xl font-serif text-black">
              {" "}
              Merhaba ben{" "}
            </h2>
            <h2 className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-500 inline-block text-transparent bg-clip-text drop-shadow-lg">
              Beyda Nur
            </h2>
          </div>

          <p className="text-lg font-serif font-medium text-black">
          💻iOS & Backend Developer | React, React Native ile modern teknolojilerle projeler geliştiriyorum.
</p>

          
          <p className="mt-4 text-md font-serif text-black italic">
            “Her gün yeni bir satır kod, yeni bir macera!” ☕
          </p>

          {/* Yetenekler */}
          <div className="mt-6 space-y-6">
            <div>
              
            </div>
            <div>
              <p className="text-black font-serif">
                Çeşitli kurumlarda mentorluk yaparak öğrencilere rehberlik
                ediyorum.
              </p>
              
            </div>
            <div>
             
              <p className="text-black font-serif">
                Modern frontend teknolojileri ile dinamik ve performanslı mobil
                uygulamalar geliştiriyorum.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-start space-x-4 space-y-4 md:space-y-0">
            <a
              href="/contact"
              className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 rounded-lg text-white font-semibold hover:shadow-lg transition-all duration-300"
            >
              📩 Benimle İletişime Geç
            </a>
            <a
              href="/projects"
              className="border border-gray-700 text-black px-6 py-3 rounded-lg hover:bg-gradient-to-r from-purple-700 to-blue-600 hover:text-white transition-all duration-300 flex items-center"
            >
              🚀 Projelerimi Keşfet
            </a>
            <a
              href="/Beyda_Nur_Pinarbasi_CV.pdf"
              download
              className="border border-gray-700 text-black px-6 py-3 rounded-lg hover:bg-gradient-to-r from-purple-700 to-blue-600 hover:text-white transition-all duration-300 flex items-center"
            >
              <FaDownload className="mr-2 text-lg" /> CV ’mi İndir
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
    </div>
  );
}
