"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="text-center mt-10 flex flex-col items-center">
      <div className="flex items-center space-x-8"> {/* Flexbox ile yan yana dizme */}
        {/* Profil Fotoğrafı - Animasyonlu */}
        <motion.div
          initial={{ opacity: 0, y: -50 }} // Başlangıçta yukarıda ve görünmez
          animate={{ opacity: 1, y: 0 }} // Aşağı inerek görünür hale gelir
          transition={{ duration: 1 }} // 1 saniyede yumuşak animasyon
        >
          <motion.div
            whileTap={{ rotateY: 180 }} // Y ekseninde döndürme efekti
          >
            <Image
              src="/profil-foto.jpeg"
              alt="Beyda Nur Pınarbaşı"
              width={200}  // Fotoğrafı büyüttüm
              height={200} // Fotoğrafı büyüttüm
              className="shadow-lg" // Yuvarlak yerine kare olmasını istiyorsanız rounded-full'ı kaldırdım
            />
          </motion.div>
        </motion.div>

        {/* Yazılar */}
        <div>
          <h1 className="text-4xl font-bold text-black mt-4">
            Merhaba, ben Beyda!
          </h1>
          <p className="mt-4 text-lg text-red-700">
            React, Next.js ve modern web teknolojileri ile projeler geliştiriyorum.
          </p>
        </div>
      </div>
    </div>
  );
}
