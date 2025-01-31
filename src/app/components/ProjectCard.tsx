interface ProjectProps {
    title: string;
    description: string;
    link: string;
  }
  
  export default function ProjectCard({ title, description, link }: ProjectProps) {
    return (
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-gray-600 mt-2">{description}</p>
        <a href={link} target="_blank" className="text-blue-500 mt-4 inline-block">
          Projeyi İncele →
        </a>
      </div>
    );
  }
  