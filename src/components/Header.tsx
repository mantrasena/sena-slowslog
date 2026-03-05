import { Search, User, Bookmark, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { PenLine, FileText, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SearchDialog from "@/components/SearchDialog";


const Header = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, profile, isFounder } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center">
          <span className="font-serif text-xl font-medium tracking-tight text-primary">Sena (◕ᴗ◕✿)</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
            
            <Search className="h-4 w-4" />
          </button>

          {user ?
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {profile?.display_name?.[0]?.toUpperCase() || "?"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => navigate("/write")} className="gap-2 cursor-pointer">
                  <PenLine className="h-4 w-4" /> Write
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/profile/${profile?.username}`)} className="gap-2 cursor-pointer">
                  <User className="h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/drafts")} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" /> Drafts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/bookmarks")} className="gap-2 cursor-pointer">
                  <Bookmark className="h-4 w-4" /> Bookmarks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" /> Settings
                </DropdownMenuItem>
                {isFounder &&
              <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2 cursor-pointer">
                    <Shield className="h-4 w-4" /> Admin
                  </DropdownMenuItem>
              }
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-muted-foreground">
                  <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> :

          <Link
            to="/auth"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            
              log in
            </Link>
          }
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>);

};

export default Header;