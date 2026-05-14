import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import * as React from "react";

import appCss from "../styles.css?url";
import { type MyRouterContext } from "../router";

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
  const { queryClient } = Route.useRouteContext();

  return (
    <>
      <HeadContent />

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
    </>
  );
}