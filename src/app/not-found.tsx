import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-black text-[#06391C] mb-2">Page Not Found</h2>
      <p className="text-sm text-[#06391C] font-semibold mb-4">
        The requested emergency resource could not be located.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-full bg-[#06391C] hover:bg-[#074020] text-white text-xs font-black shadow-apple-pill transition-all"
      >
        Return to Disaster Console
      </Link>
    </div>
  );
}
