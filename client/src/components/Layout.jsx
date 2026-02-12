import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className='min-h-screen w-auto bg-gray-50'>
      <Navbar />
      <main className='max-w-auto m-20 space-y-10'>
        <section className='bg-white/80 p-6 shadow-md rounded-xl'>
          <Outlet />
        </section>
      </main>
      <br />
    </div>
  );
};

export default Layout;
