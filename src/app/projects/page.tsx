import ProjectCard from "../components/ProjectCard";

const projects = [
  {
    title: "Depo Yönetim Sistemi",
    description: "React, Redux ve Firebase kullanarak geliştirdiğim bir sistem.",
    link: "https://github.com/beydanp/firebase-depo",
  },
  {
    title: "React Native Ürün Arama",
    description: "React Native ile oluşturduğum mobil uygulama.",
    link: "https://github.com/beydanp/react-native-search",
  },
];

export default function ProjectsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Projelerim</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>
    </div>
  );
}
