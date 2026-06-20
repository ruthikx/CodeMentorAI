import { SignupForm } from "../../src/components/signup-form";

interface SignupPageProps {
  searchParams?: {
    callbackUrl?: string;
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <SignupForm callbackUrl={searchParams?.callbackUrl ?? "/dashboard"} />
    </main>
  );
}
