"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaInstagram, FaLinkedin, FaDownload, FaEnvelope } from "react-icons/fa";

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
      <div className="relative z-10 flex flex-col md:flex-row items-center mt-20 md:mt-10 space-y-6 md:space-x-8 md:space-y-0">
        
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
          <h1 className="text-3xl  md:text-4xl font-serif  text-black mt-4">
            Merhaba, ben Beyda Nur! 👋
          </h1>
          <p className="mt-4 text-md md:text-l font-serif text-black">
            iOS & Backend Developer | React, Next.js ve modern teknolojilerle projeler geliştiriyorum.
          </p>
          <p className="mt-4 text-md font-serif  text-black">
            Teknoloji geleceğe umut süreci🚀
          </p>
          <p className="mt-4 text-md font-serif text-black italic">
            “Her gün yeni bir satır kod, yeni bir macera!” ☕
          </p>

          {/* Yetenekler */}
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-lg font-serif text-black">💻 iOS & Backend Development</h2>
            
            </div>
            <div>
              <h2 className="text-lg font-serif text-black">🌍 Dijital Pazarlama & İçerik Üreticisi</h2>
              <p className="text-black font-serif">SEO üzerine çalışıyorum ve sosyal medya hesabım üzerinden yazılım sürecimi paylaşıyorum </p>
            </div>
            <div>
              <h2 className="text-lg  font-serif text-black">🎓 Mentorluk & Eğitmen</h2>
              <p className="text-black font-serif">Çeşitli kurumlarda mentorluk yaparak öğrencilere rehberlik ediyorum.</p>
            </div>
            <div>
              <h2 className="text-lg  font-serif text-black">🚀 React, Next.js, React Native</h2>
              <p className="text-black font-serif">Modern frontend teknolojileri ile dinamik ve performanslı uygulamalar geliştiriyorum.</p>
            </div>
          </div>

          {/* Butonlar */}
          <div className="mt-6 flex flex-wrap justify-center md:justify-start space-x-4 space-y-4 md:space-y-0">
            <a href="/contact" className="bg-purple-700 px-6 py-3 rounded-lg font-serif text-black hover:bg-purple-300 transition">
              📩 Benimle İletişime Geç
            </a>
            <a href="/projects" className="border border-gray-700 font-serif text-black px-6 py-3 rounded-lg hover:bg-purple-700 hover:border-purple-700 transition flex items-center">
              🚀 Projelerimi Keşfet
            </a>
            <a href="/Beyda_Nur_Pinarbasi_CV.pdf" download className="border border-gray-700 font-serif text-black px-6 py-3 rounded-lg hover:bg-purple-700 hover:border-purple-700 transition flex items-center">
              <FaDownload className="mr-2 text-lg" /> CV ’mi İndir
            </a>
          </div>

          {/* Sosyal Medya */}
          <div className="mt-6 flex space-x-6 text-3xl text-slate-950 justify-center md:justify-start">
            {[{ href: "https://www.linkedin.com/in/beyda-nur-p%C4%B1narba%C5%9F%C4%B1/", icon: <FaLinkedin className="hover:text-blue-700 transition" /> },
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
