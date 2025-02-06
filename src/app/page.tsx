"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="text-center mt-10 flex flex-col items-center">
      {/* Profil Fotoğrafı - Animasyonlu */}
      <motion.div
        initial={{ opacity: 0, y: -50 }} // Başlangıçta yukarıda ve görünmez
        animate={{ opacity: 1, y: 0 }} // Aşağı inerek görünür hale gelir
        transition={{ duration: 1 }} // 1 saniyede yumuşak animasyon
      >
        <Image
          src="/profil-foto.png" // Kendi fotoğrafının yolunu eklemelisin
          alt="Beyda Pınarbaşı"
          width={150}
          height={150}
          className="rounded-full shadow-lg"
        />
      </motion.div>

      {/* Yazılar */}
      <h1 className="text-4xl font-bold text-black mt-4">
        Merhaba, ben Beyda!
      </h1>
      <p className="mt-4 text-lg text-red-700">
        React, Next.js ve modern web teknolojileri ile projeler geliştiriyorum.
      </p>
    </div>
  );
}
