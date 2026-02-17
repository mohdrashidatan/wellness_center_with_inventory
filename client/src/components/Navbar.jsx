import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User, X, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/utils";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [educationDropdownOpen, setEducationDropdownOpen] = useState(false);
  const [setupDropdownOpen, setSetupDropdownOpen] = useState(false);
  const [coyname, setCoyname] = useState("");
  const { user, loading } = useAuth();

  useEffect(() => {
    api.get(`${API_BASE_URL}/api/possetup`)
      .then((res) => setCoyname(res.data.coyname || ""))
      .catch(() => {});
  }, []);
  //   const userData = authService.getUserInfo();

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.removeToken();
    navigate("/login");
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  let navItems;
  if (user.role == "Customer") {
    navItems = [
      { path: "/", label: "Home" },
      { path: "/profile", label: "Profile" },
      {
        label: "Stocks",
        dropdown: [
          { path: "/therapist/stocks/reports", label: "Reports" },
          { path: "/therapist/stocks/incoming", label: "Received" },
          { path: "/therapist/stocks/transfers", label: "Transfers" },
          { path: "/therapist/stocks/adjustments", label: "Adjustments" },
        ],
      },
      {
        label: "Setup",
        dropdown: [
          { path: "/therapist/setup/uom", label: "UOM" },
          { path: "/therapist/setup/users", label: "Users" },
          { path: "/therapist/setup/products", label: "Products" },
          { path: "/therapist/setup/product-variants", label: "Product Variants" },
        ],
      },
    ];
  } else {
    navItems = [
      { path: "/therapist", label: "Home" },
      {
        label: "Sales",
        dropdown: [
          { path: "/therapist/sales/reports", label: "Reports" },
          { path: "/therapist/pos", label: "Sales" },
        ],
      },
      {
        label: "Stocks",
        dropdown: [
          { path: "/therapist/stocks/reports", label: "Reports" },
          { path: "/therapist/stocks/incoming", label: "Received" },
          { path: "/therapist/stocks/transfers", label: "Transfers" },
          { path: "/therapist/stocks/adjustments", label: "Adjustments" },
        ],
      },
      {
        label: "Setup",
        dropdown: [
          { path: "/therapist/setup/uom", label: "UOM" },
          { path: "/therapist/setup/users", label: "Users" },
          { path: "/therapist/setup/products", label: "Products" },
          { path: "/therapist/setup/product-variants", label: "Product Variants" },
        ],
      },
    ];
  }

  return (
    <nav className='bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50'>
      <div className='max-w-[1920px] mx-auto px-10'>
        <div className='flex items-center justify-between h-16 md:h-20'>
          {/* Logo */}
          <div className='flex-shrink-0 transition-transform hover:scale-105'>
            {/* <img src={Logo} alt="Tatheer Logo" className="h-10 md:h-12 w-auto" /> */}
            <div className='flex-shrink-0 transition-transform hover:scale-105 flex items-center space-x-2'>
              <img src='/tcpl-logo.png' alt='Company Logo' className='h-10 md:h-12 w-auto' />
              {coyname && <p className='text-blue-900 font-bold'>{coyname}</p>}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-1 ml-auto'>
            {navItems.map((item) =>
              item.dropdown ? (
                <div className='relative group' key={item.label}>
                  <button
                    className={`flex items-center space-x-1 px-4 py-2 rounded-md text-md font-medium text-black transition-all duration-200 ${location.pathname.startsWith(item.dropdown[0].path.split("/").slice(0, -1).join("/")) ? "text-purple-400 bg-black" : "text-black hover:text-purple-400"}`}
                    onClick={() => (item.label === "Education" ? setEducationDropdownOpen(!educationDropdownOpen) : setSetupDropdownOpen(!setupDropdownOpen))}>
                    <span>{item.label}</span>
                    <ChevronDown size={16} className='ml-1' />
                  </button>
                  <div className='absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 right-0 mt-1 w-48 bg-black rounded-md shadow-lg transition-all duration-200 z-50'>
                    {item.dropdown.map((subItem) => (
                      <Link key={subItem.path} to={subItem.path} className={`block px-4  py-2 text-md transition-colors rounded-md duration-200 ${location.pathname === subItem.path ? "text-white bg-prime-color" : "text-white hover:text-purple-400"}`}>
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={item.path} to={item.path} className={`flex items-center px-4 text-black py-2 rounded-full text-md font-medium transition-all duration-200 ${location.pathname === item.path ? "text-black bg-prime-color" : "text-black hover:text-purple-400"}`}>
                  {item.label}
                </Link>
              )
            )}

            {/* Profile Section */}
            <div className='relative ml-4'>
              <div className='flex items-center cursor-pointer' onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <Avatar className='h-8 w-8 ring-2 ring-gray-800 hover:ring-purple-400 transition-all duration-200'>
                  <AvatarImage src='/api/placeholder/32/32' alt='Profile' />
                  <AvatarFallback className='bg-black text-gray-200'>
                    {/* {getUserInitials(userData?.userName)} */}
                    {getUserInitials("ADMIN")}
                  </AvatarFallback>
                </Avatar>
              </div>
              {isDropdownOpen && (
                <div className='absolute right-0 mt-2 w-48 bg-purple-500 rounded-md shadow-lg z-50 border border-gray-800'>
                  <Button variant='ghost' className='w-full flex items-center space-x-2 justify-start text-gray-200 hover:text-purple-400' onClick={() => navigate("/therapist/pos")}>
                    <User size={16} className='shrink-0' />
                    <span>Sales</span>
                  </Button>
                  <Button variant='ghost' className='w-full flex items-center space-x-2 justify-start text-gray-200 hover:text-red-400' onClick={handleLogout}>
                    <LogOut size={16} className='shrink-0' />
                    <span>Logout</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className='p-2 rounded-md text-gray-200 hover:text-purple-400 hover:bg-black hover:rounded-md transition-colors duration-200'>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className='md:hidden border-t border-gray-800'>
          <div className='px-2 pt-2 pb-3 space-y-1'>
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${location.pathname === item.path ? "text-purple-400 bg-black" : "text-gray-200 hover:text-purple-400"}`} onClick={() => setIsMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className='border-t border-gray-800 pt-2'>
              <Button
                variant='ghost'
                className='w-full flex items-center space-x-2 justify-start text-gray-200 hover:text-purple-400 hover:bg-black hover:rounded-md'
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/profile");
                }}>
                <User size={16} className='shrink-0' />
                <span>Profile</span>
              </Button>
              <Button
                variant='ghost'
                className='w-full flex items-center space-x-2 justify-start text-gray-200 hover:text-red-400 hover:bg-black hover:rounded-md'
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}>
                <LogOut size={16} className='shrink-0' />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
