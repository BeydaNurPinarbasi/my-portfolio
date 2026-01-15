'use client';
import React, { useState } from 'react';
import { FaEnvelope, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); 
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg('');

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMsg("Mesajınız başarıyla gönderildi!");
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        setResponseMsg(data.error || "Mesaj gönderilirken bir hata oluştu.");
      }
    } catch (error) {
      if (error instanceof Error) {
        setResponseMsg(`Sunucu hatası: ${error.message}`);
      } else {
        setResponseMsg("Bilinmeyen bir hata oluştu. Daha sonra tekrar deneyin.");
      }
    }

    setLoading(false);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20">
      {/* Arka Plan */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/Wallpaper_Nasa.jpeg')" }}
      />
      <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 transition-opacity duration-300"></div>

      {/* İçerik */}
      <div className="relative z-10 max-w-4xl mx-auto text-center text-white p-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-3xl sm:text-4xl font-extrabold mb-4"
        >
          İletişime Geç!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-base sm:text-lg mb-8"
        >
          Soruların mı var? Bana ulaşmak için aşağıdaki formu doldurabilirsin.
        </motion.p>

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className="w-full sm:max-w-md mx-auto bg-white dark:bg-gray-800 bg-opacity-20 dark:bg-opacity-30 p-6 sm:p-8 rounded-xl shadow-xl backdrop-blur-xs"
        >
          <div className="mb-4 text-left">
            <label htmlFor="name" className="block text-sm sm:text-lg font-medium">Adınız</label>


           <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 mt-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Adınızı girin"
              required
            />

  
          </div>

          <div className="mb-4 text-left">
            <label htmlFor="email" className="block text-sm sm:text-lg font-medium">E-mail</label>
            <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 mt-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="E-mail adresinizi girin"
            required
          />

          </div>


          <div className="mb-4 text-left">
        <label htmlFor="phone" className="block text-sm sm:text-lg font-medium">
    Telefon Numarası
  </label>
  <input
    type="tel" 
    id="phone"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    className="w-full px-4 py-3 mt-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
    placeholder="Telefon numaranızı girin"
    required
  />
</div>

          <div className="mb-4 text-left">
            <label htmlFor="message" className="block text-sm sm:text-lg font-medium">Mesajınız</label>
            <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 mt-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Mesajınızı yazın..."
            rows={4}
            required
          />


          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-slate-900 dark:bg-slate-800 text-white text-sm sm:text-lg rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
            disabled={loading}
          >
            {loading ? "Gönderiliyor..." : "Mesaj Gönder"}
          </button>
        </form>

        {responseMsg && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`text-center mt-4 ${responseMsg.includes("hata") ? "text-red-600" : "text-green-600"}`}
          >
            {responseMsg}
          </motion.p>
        )}

        {/* Sosyal Medya */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 flex justify-center space-x-6 text-gray-300"
        >
          <motion.a 
            href="mailto:beydanur.pinarbasi@gmail.com" 
            className="text-2xl hover:text-blue-400"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaEnvelope />
          </motion.a>
          
          <motion.a 
            href="https://www.linkedin.com/in/beyda-nur-p%C4%B1narba%C5%9F%C4%B1/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-2xl hover:text-blue-400"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaLinkedin />
          </motion.a>
          
          <motion.a 
            href="https://www.instagram.com/cekununzamani/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-2xl hover:text-slate-400"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaInstagram />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
