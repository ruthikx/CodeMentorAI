import { LoginForm } from "../../src/components/login-form";

interface LoginPageProps {
  searchParams?: {
    callbackUrl?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <LoginForm callbackUrl={searchParams?.callbackUrl ?? "/dashboard"} />
    </main>
  );
}
