'use client';
import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Burada form verilerini işleyebilirsiniz
    alert(`Mesajınız gönderildi: ${message}`);
  };

  return (
    <section id="contact" className="py-12 px-4 bg-gray-100">
      <div className="max-w-6xl mx-auto text-center">

      <p className="text-lg text-gray-700 mb-8"> Bu sayfanın geliştirilmesi tamamlanmamıştır. iletişim için beydanur.pinarbasi@gmail.com veyahut linkedlyn tercih ediniz!</p>
        <h2 className="text-4xl font-bold text-gray-800 mb-6">Contact Me</h2>
        <p className="text-lg text-gray-700 mb-8">
          Eğer projelerim veya işbirlikleri hakkında daha fazla bilgi almak isterseniz, aşağıdaki formu doldurarak benimle iletişime geçebilirsiniz.
        </p>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-4">
            <label htmlFor="name" className="block text-left text-lg text-gray-700">Adınız</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adınızı girin"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-left text-lg text-gray-700">Email Adresiniz</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email adresinizi girin"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-left text-lg text-gray-700">Mesajınız</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mesajınızı buraya yazın"
              rows={5}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Mesaj Gönder
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
