import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, BarChart3, LogOut, LogIn, Shield, UserCircle } from "lucide-react";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl tracking-wider">MEU TIME</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" icon={<Trophy className="h-4 w-4" />}>Início</NavLink>
          <NavLink to="/elenco" icon={<Users className="h-4 w-4" />}>Elenco</NavLink>
          <NavLink to="/jogos" icon={<Calendar className="h-4 w-4" />}>Jogos</NavLink>
          <NavLink to="/ranking" icon={<BarChart3 className="h-4 w-4" />}>Ranking</NavLink>
          {user && <NavLink to="/perfil" icon={<UserCircle className="h-4 w-4" />}>Perfil</NavLink>}
          {isAdmin && (
            <>
              <NavLink to="/admin" icon={<Shield className="h-4 w-4" />}>Atletas</NavLink>
              <NavLink to="/admin/jogos" icon={<Calendar className="h-4 w-4" />}>Admin Jogos</NavLink>
              <NavLink to="/admin/time" icon={<Shield className="h-4 w-4" />}>Admin Time</NavLink>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline">
                <LogIn className="h-4 w-4" /> Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary bg-secondary" }}
    >
      {icon}
      {children}
    </Link>
  );
}