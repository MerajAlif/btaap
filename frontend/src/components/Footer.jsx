// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Library", href: "/library" },
    { label: "Solving Hub", href: "/posts" },
    { label: "Pricing", href: "/pricing" },
  ];

  const resources = [
    { label: "My Posts", href: "/my-posts" },
    { label: "Downloads", href: "/downloads" },
    { label: "Credits", href: "/credits" },
    { label: "Profile", href: "/profile" },
  ];

  const legal = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Refund Policy", href: "/refund" },
  ];

  return (
    <footer className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200">
              Btaap
            </h3>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Your complete learning platform for academic success. Access thousands of resources and connect with expert mentors.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-800 hover:bg-emerald-700 flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-800 hover:bg-emerald-700 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-800 hover:bg-emerald-700 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-800 hover:bg-emerald-700 flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-emerald-200">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-emerald-100 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-emerald-200">Resources</h4>
            <ul className="space-y-2">
              {resources.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-emerald-100 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-emerald-200">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-emerald-100 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>123 Learning Street, Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-100 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+880 1234-567890</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-100 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:support@btaap.com" className="hover:text-white transition-colors">
                  support@btaap.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-emerald-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-emerald-200 text-sm">
              © {currentYear} Btaap. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {legal.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-emerald-200 hover:text-white transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}