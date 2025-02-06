import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-12 px-4 bg-gray-100">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-6">About Me</h2>
        <p className="text-lg text-gray-700 mb-8">
          Merhaba ben Beyda, Software Developer olarak kariyerime devam ediyorum. Uzmanlıklarım Mobil ve Full Stack alanında bulunmaktadır.
        </p>

        <h3 className="text-3xl font-semibold text-gray-800 mb-4">Skills & Expertise</h3>
        <ul className="list-disc list-inside text-gray-700 mb-8">
          <li><strong>Frontend:</strong> React JS,JavaScript, Bootstrap, Tailwind CSS</li>
          <li><strong>Mobile Development:</strong> React Native</li>
          <li><strong>Backend:</strong> Node.js, .Net</li>
          <li><strong>Database:</strong> MySQL, Firebase, SQLite</li>
          <li><strong>Version Control:</strong> Git, GitHub</li>
        </ul>

        <h3 className="text-3xl font-semibold text-gray-800 mb-4">Projects</h3>
        <ul className="text-gray-700 mb-8">
          <li><a href="#" className="text-blue-500">Proje0</a>: Açıklama </li>
          <li><a href="#" className="text-blue-500">Proje1 </a>: Açıklama</li>
          <li><a href="#" className="text-blue-500">Proje2</a>: Açıklama</li>
        </ul>

        <h3 className="text-3xl font-semibold text-gray-800 mb-4">Experience</h3>
        <ul className="text-gray-700 mb-8">
          <li><strong>Rol</strong> | Şirket Adı | 2023 - Present</li>
          <li><strong>Rol</strong> | Şirket Adı | 2022 - 2023</li>
        </ul>

        <h3 className="text-3xl font-semibold text-gray-800 mb-4">Future Goals</h3>
        <p className="text-lg text-gray-700 mb-8">
          Gelecekte yazılım geliştirme alanında daha fazla deneyim kazanmayı ve insanlara verimli çözümler sunan projeler yaratmayı hedefliyorum.
        </p>

        <h3 className="text-3xl font-semibold text-gray-800 mb-4">Contact Me</h3>
        <p className="text-lg text-gray-700 mb-8">
          Eğer projelerim hakkında konuşmak isterseniz, bana şu şekilde ulaşabilirsiniz:
        </p>
        <p className="text-lg text-gray-700">
          📧 <strong>Email:</strong> beydanur.pinarbasi@gmail.com <br />
          🔗 <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/beyda-nur-p%C4%B1narba%C5%9F%C4%B1/" className="text-blue-500">LinkedIn Profilim</a>
        </p>
      </div>
    </section>
  );
};

export default About;
