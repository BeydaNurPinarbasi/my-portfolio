import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-purple-700 text-white p-4 flex justify-between items-center rounded-lg shadow-lg">
      <h1 className="text-xl font-bold">Beyda.dev</h1>
      <div className="space-x-4">
        <Link
          href="/"
          className="bg-white text-purple-700 px-4 py-2 rounded-md hover:bg-purple-500 hover:text-white transition"
        >
          Ana Sayfa
        </Link>
        <Link
          href="/about"
          className="bg-white text-purple-700 px-4 py-2 rounded-md hover:bg-purple-500 hover:text-white transition"
        >
          Hakkımda
        </Link>
        <Link
          href="/projects"
          className="bg-white text-purple-700 px-4 py-2 rounded-md hover:bg-purple-500 hover:text-white transition"
        >
          Projeler
        </Link>
        <Link
          href="/contact"
          className="bg-white text-purple-700 px-4 py-2 rounded-md hover:bg-purple-500 hover:text-white transition"
        >
          İletişim
        </Link>
      </div>
    </nav>
  );
}
