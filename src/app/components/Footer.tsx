import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-white py-8">
      <div className="container mx-auto px-6 grid md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Sol - Hakkımda */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Beyda.dev</h3>
          <p>Yazılım geliştiricisi olarak projelerimi burada paylaşıyorum.</p>
        </div>

        {/* Orta - Menü */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Bağlantılar</h3>
          <ul className="space-y-2">
          <Link href="/" className="hover:text-purple-400">Ana Sayfa</Link>
            <li><a href="/about" className="hover:text-purple-400">Hakkımda</a></li>
            <li><a href="/projects" className="hover:text-purple-400">Projeler</a></li>
            <li><a href="/contact" className="hover:text-purple-400">İletişim</a></li>
          </ul>
        </div>

        {/* Sağ - Sosyal Medya */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Bana Ulaş</h3>
          <div className="flex justify-center md:justify-start space-x-4">
            <a href="https://github.com/BeydaNurPinarbasi" target="_blank" className="hover:text-purple-400">
              <FaGithub size={24} />
            </a>
            <a href="https://www.linkedin.com/in/beyda-nur-p%C4%B1narba%C5%9F%C4%B1/" target="_blank" className="hover:text-purple-400">
              <FaLinkedin size={24} />
            </a>
            <a href="mailto:beydanur.pinarbasi@gmail.com" className="hover:text-purple-400">
              <FaEnvelope size={24} />
            </a>
          </div>
        </div>
      </div>

      {/* Alt Kısım */}
      <div className="mt-6 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Beyda.dev | Tüm Hakları Saklıdır.
      </div>
    </footer>
  );
}
