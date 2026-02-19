export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Novi
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your AI travel companion - decision paralysis solved
        </p>
        <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition">
          Get Started
        </button>
      </div>
    </main>
  );
}
