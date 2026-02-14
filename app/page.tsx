
import ConverterForm from './components/ConverterForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/10 blur-[100px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/10 blur-[100px] rounded-full mix-blend-screen animate-pulse delay-75" />
      </div>

      <div className="z-10 w-full">
        <ConverterForm />
      </div>

      <footer className="mt-12 text-gray-500 text-sm z-10">
        <p>Powered by Next.js & FFmpeg</p>
      </footer>
    </main>
  );
}
