// src/components/Navbar.jsx - UPDATED WITH COMMUNITIES
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink, Link, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import {
  User,
  Coins,
  LogOut,
  ChevronDown,
  MessageSquare,
  Download,
  BookOpen,
  Users,
  LayoutDashboard,
  Award,
  Sparkles,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Library", href: "/library" },
  { label: "Communities", href: "/communities" },
  { label: "Solving Hub", href: "/posts" },
  { label: "Pricing", href: "/pricing" },
];

const baseLink =
  "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50";
const activeLink = "bg-accent text-accent-foreground";

export default function Navbar() {
  const { user, isAdmin, isApprovedMentor, isPendingMentor, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          <div className="font-bold text-xl text-emerald-900">Btaap</div>
        </Link>

        {/* Desktop Menu */}
        <NavigationMenu className="hidden md:block">
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `${baseLink} ${isActive ? activeLink : ""}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side (auth) */}
        <div className="hidden md:flex items-center gap-2">
          {isPendingMentor && (
            <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md">
              Pending Approval
            </span>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  {user.name}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground capitalize">
                        Role: {user.role}
                      </p>
                      {user.role === "mentor" && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          user.approvalStatus === "approved" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {user.approvalStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* ✅ Profile */}
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                {/* ✅ Credits */}
                <DropdownMenuItem asChild>
                  <Link to="/credits" className="cursor-pointer">
                    <Coins className="mr-2 h-4 w-4" />
                    Credits ({user.credits || 0})
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* ✅ STUDENT SPECIFIC */}
                {user.role === "student" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/my-communities" className="cursor-pointer">
                        <Sparkles className="mr-2 h-4 w-4" />
                        My Communities
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/apply-mentor" className="cursor-pointer">
                        <Award className="mr-2 h-4 w-4 text-amber-600" />
                        <span className="text-amber-600 font-medium">Become a Mentor</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* ✅ MENTOR SPECIFIC */}
                {isApprovedMentor && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/mentor/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Mentor Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Posts & Downloads */}
                <DropdownMenuItem asChild>
                  <Link to="/my-posts" className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Posts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/downloads" className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    Downloads
                  </Link>
                </DropdownMenuItem>

                {/* ✅ ADMIN */}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/mentors" className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Menu <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link to={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/credits">
                    <Coins className="mr-2 h-4 w-4" />
                    Credits
                  </Link>
                </DropdownMenuItem>

                {user.role === "student" && (
                  <DropdownMenuItem asChild>
                    <Link to="/my-communities">
                      <Sparkles className="mr-2 h-4 w-4" />
                      My Communities
                    </Link>
                  </DropdownMenuItem>
                )}

                {isApprovedMentor && (
                  <DropdownMenuItem asChild>
                    <Link to="/mentor/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Mentor Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}