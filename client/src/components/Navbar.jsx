import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import Logo from "../assets/icons/logo.png";
import Button from "./Button";

export default function Navbar() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold">
        <img
          src={Logo}
          alt="Hussain Forces Academy Logo"
          className="h-16  w-16 object-contain"
        />
        <span className="leading-tight">
          HUSSAIN FORCES ACADEMY
          <br />
          <small className="text-xs font-medium tracking-wider text-[#c9b86a]">
            CRADLE OF LEADERS
          </small>
        </span>
      </Link>

      <nav className="hidden items-center gap-7 text-sm text-[#a8b2aa] md:flex">
        <a href="#features" className="hover:text-white">
          Features
        </a>

        <a href="#platform" className="hover:text-white">
          Platform
        </a>

        <Link to="/login">
          <Button className="px-4 py-2.5">Login</Button>
        </Link>
      </nav>

      <Menu className="text-zinc-300 md:hidden" />
    </header>
  );
}
