// src/components/Navbar.jsx - UPDATED WITH COMMUNITIES
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Star,
} from "lucide-react";
import NotificationBell from "./NotificationBell";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
];

const servicesItems = [
  {
    label: "Library",
    href: "/library",
    icon: BookOpen,
    description: "Access study materials and PDFs"
  },
  {
    label: "Communities",
    href: "/communities",
    icon: Users,
    description: "Join learning communities"
  },
  {
    label: "Solving Hub",
    href: "/posts",
    icon: MessageSquare,
    description: "Ask questions and help others"
  },
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
            {/* Regular nav items */}
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

            {/* Services Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={baseLink}>
                Services
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[320px] gap-2 p-4">
                  {servicesItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="block select-none rounded-lg p-3 leading-none no-underline outline-none transition-all hover:bg-emerald-50 hover:shadow-md focus:bg-emerald-50 group border border-transparent hover:border-emerald-200"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center group-hover:from-emerald-200 group-hover:to-teal-200 transition-all group-hover:scale-110">
                                <Icon className="w-5 h-5 text-emerald-700" />
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {item.label}
                              </div>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600 ml-[52px]">
                              {item.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    );
                  })}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Pricing Link */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <NavLink
                  to="/pricing"
                  className={({ isActive }) =>
                    `${baseLink} ${isActive ? activeLink : ""}`
                  }
                >
                  Pricing
                </NavLink>
              </NavigationMenuLink>
            </NavigationMenuItem>
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} title="Messages">
                <MessageSquare className="h-5 w-5 text-gray-600" />
              </Button>

              <NotificationBell />

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
                          <span className={`text-xs px-1.5 py-0.5 rounded ${user.approvalStatus === "approved"
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
                      <DropdownMenuItem asChild>
                        <Link to="/admin/join-requests" className="cursor-pointer">
                          <Users className="mr-2 h-4 w-4" />
                          Join Requests
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/complaints" className="cursor-pointer">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Complaints
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/feedback" className="cursor-pointer">
                          <Star className="mr-2 h-4 w-4" />
                          Feedback
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
            </div>
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
          {user && (
            <>
              <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} title="Messages">
                <MessageSquare className="h-5 w-5 text-gray-600" />
              </Button>
              <NotificationBell />
            </>
          )}

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

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Services</DropdownMenuLabel>

              {servicesItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link to={item.href} className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link to="/pricing" className="flex items-center">
                  <Coins className="mr-2 h-4 w-4" />
                  Pricing
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Role: {user.role}
                    </p>
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
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/my-communities">
                        <Sparkles className="mr-2 h-4 w-4" />
                        My Communities
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/apply-mentor">
                        <Award className="mr-2 h-4 w-4 text-amber-600" />
                        <span className="text-amber-600 font-medium">Become a Mentor</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
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
                <DropdownMenuItem asChild>
                  <Link to="/my-posts">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Posts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/downloads">
                    <Download className="mr-2 h-4 w-4" />
                    Downloads
                  </Link>
                </DropdownMenuItem>

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