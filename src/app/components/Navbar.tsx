import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between">
      <h1 className="text-xl font-bold">Beyda.dev</h1>
      <div className="space-x-4">
        <Link href="/">Ana Sayfa</Link>
        <Link href="/about">Hakkımda</Link>
        <Link href="/projects">Projeler</Link>
        <Link href="/contact">İletişim</Link>
      </div>
    </nav>
  );
}
