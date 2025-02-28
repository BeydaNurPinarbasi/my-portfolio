
"use client";

import React, { useState } from "react";
import Image from "next/image";

const allProjects = [
  {
    title: "Professional Portfolio | Built with Next.js & React",
    description: "A professional portfolio website crafted using Next.js and React.",
    github: "https://github.com/BeydaNurPinarbasi/my-portfolio",
    liveDemo: "https://beyda.dev",
    category: "Web",
  },
  {
    title: "Find Your Stay | Map-Based Hotel Finder",
    description: "Discover hotels in different cities and view their locations on the map.",
    github: "https://github.com/BeydaNurPinarbasi/Otel_Project",
    liveDemo: null,
    images: ["/Otelproject1.png", "/Otelproject2.png"],
    category: "Mobile"
  }
];

const categories = ["All", "Web", "Mobile"];

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredProjects =
    selectedCategory === "All"
      ? allProjects
      : allProjects.filter((project) => project.category === selectedCategory);

  return (
    <section className="py-20 px-6 text-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6">My Projects</h2>
        <p className="text-lg text-gray-700 mb-8">
          İşte geliştirdiğim bazı projeler. Daha fazla detay için GitHub&apos;ımı ziyaret edebilirsin! 🚀
        </p>

        {/* Kategoriler */}
        <div className="flex justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-blue-400 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Proje Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project, index) => (
            <div key={index} className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition duration-300">
              <h3 className="text-l font-bold text-gray-900">{project.title}</h3>
              <p className="text-gray-700 my-2">{project.description}</p>

              {/* Resimler */}
              {project.images && project.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {project.images.map((imgSrc, idx) => (
                   <Image
                   key={idx}
                   src={imgSrc}
                   alt={`Project image ${idx + 1}`}
                   className="w-[400px] h-[400px] object-cover rounded-lg"
                   height={250}
                   width={400}
                 />
                 
                  ))}
                </div>
              )}

              {/* Live Demo */}
              {project.liveDemo ? (
                <iframe
                  src={project.liveDemo}
                  className="w-full h-[450px] border rounded-lg my-3"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-top-navigation"
                ></iframe>
              ) : (
                <p className="text-gray-500 text-sm italic my-2">Live demo mevcut değil</p>
              )}

              {/* Linkler */}
              <div className="flex gap-3 mt-4">
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-800 text-white py-2 rounded-md text-center text-sm hover:bg-gray-900 transition"
                >
                  GitHub
                </a>

                {project.liveDemo ? (
                  <a
                    href={project.liveDemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md text-center text-sm hover:bg-blue-700 transition"
                  >
                    Live Demo
                  </a>
                ) : (
                  <span className="flex-1 text-gray-500 py-2 rounded-md text-center text-sm border border-gray-300 cursor-not-allowed">
                    No Demo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
