import ProjectCard from "../components/ProjectCard";

const projects = [
  {
    title: "Proje0",
    description: "Açıklama",
    link: "https://github.com/beydanp/firebase-depo",
  },
  {
    title: "Proje1",
    description: "React Native ile oluşturduğum mobil uygulama.",
    link: "https://github.com/beydanp/react-native-search",
  },
  {
    title: "Proje2",
    description: "React Native ile oluşturduğum mobil uygulama.",
    link: "https://github.com/beydanp/react-native-search",
  },
];


export default function ProjectsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Projelerim</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>
    </div>
  );
}
