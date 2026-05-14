import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import * as React from 'react';
import appCss from "../styles.css?url";
import { type MyRouterContext } from "../router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/SiteHeader";

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  React.useEffect(() => {
    console.error("ERRO CAPTURADO:", error);
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">A página não carregou corretamente</h1>
        <p className="mt-2 text-sm text-red-500 font-mono">{error?.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Tentar novamente
          </button>
          <Link to="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground">
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Meu Time — Gestão do Clube" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <html lang="pt-br">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SiteHeader />
            <div className="min-h-screen bg-background">
              <Outlet />
            </div>
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}