import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import * as React from "react";

// Importação do CSS
import appCss from "../styles.css?url";
import { type MyRouterContext } from "../router";

// Provedores e Componentes
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Arena Resenha",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  // Extrai o queryClient do contexto definido no seu router.ts
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="pt-br">
      <head>
        {/* Renderiza as metas e links definidos no head: () acima */}
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <div className="min-h-screen flex flex-col bg-background">
              <SiteHeader />
              <main className="flex-1">
                {/* O Outlet renderiza o conteúdo das rotas filhas */}
                <Outlet />
              </main>
              <Toaster />
            </div>
          </AuthProvider>
        </QueryClientProvider>

        {/* CRUCIAL: Injeta os scripts do TanStack para a hidratação (evita tela preta) */}
        <Scripts />
      </body>
    </html>
  );
}