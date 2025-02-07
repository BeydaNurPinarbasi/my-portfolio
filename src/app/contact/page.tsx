'use client';
import React, { useState } from 'react';
import { FaEnvelope, FaLinkedin, FaInstagram } from 'react-icons/fa';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMsg("Mesajınız başarıyla gönderildi!");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setResponseMsg(data.error || "Mesaj gönderilirken bir hata oluştu.");
      }
    }catch (error) {
      if (error instanceof Error) {
        setResponseMsg(`Sunucu hatası: ${error.message}`);
      } else {
        setResponseMsg("Bilinmeyen bir hata oluştu. Daha sonra tekrar deneyin.");
      }
    }
  };

  return (
    <section id="contact" className="py-16 px-6 bg-gray-50 text-gray-800">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">İletişime Geç!</h2>
        <p className="text-lg text-gray-600 mb-8">
          Soruların mı var? Bana ulaşmak için aşağıdaki formu doldurabilirsin.
        </p>

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-xl">
          <div className="mb-4 text-left">
            <label htmlFor="name" className="block text-lg font-medium">Adınız</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adınızı girin"
              required
            />
          </div>

          <div className="mb-4 text-left">
            <label htmlFor="email" className="block text-lg font-medium">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E-mail adresinizi girin"
              required
            />
          </div>

          <div className="mb-4 text-left">
            <label htmlFor="message" className="block text-lg font-medium">Mesajınız</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mesajınızı yazın..."
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-blue-500 text-white text-lg rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={loading}
          >
            {loading ? "Gönderiliyor..." : "Mesaj Gönder"}
          </button>
        </form>

        {responseMsg && (
          <p className={`text-center mt-4 ${responseMsg.includes("hata") ? "text-red-600" : "text-green-600"}`}>
            {responseMsg}
          </p>
        )}

        {/* Sosyal Medya */}
        <div className="mt-8 flex justify-center space-x-6 text-gray-600">
          <a href="mailto:beydanur.pinarbasi@gmail.com" className="hover:text-blue-500 text-2xl">
            <FaEnvelope />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 text-2xl">
            <FaLinkedin />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 text-2xl">
            <FaInstagram />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contact;
