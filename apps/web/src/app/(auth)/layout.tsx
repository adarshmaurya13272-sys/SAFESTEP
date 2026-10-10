export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1426] to-[#14213D] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-heading font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-cyan-200">
          SAFESTEP
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-border">
          {children}
        </div>
      </div>
    </div>
  );
}
