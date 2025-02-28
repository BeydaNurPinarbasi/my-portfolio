import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // Footer'ı ekledik
import "./styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className=" bg-gray-100 flex flex-col min-h-screen">
        <Navbar />
        <main className="min-h-screen container mx-auto p-4 flex-grow">{children}</main>
        <Footer /> 
      </body>
    </html>
  );
}
