import { FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";
interface NavaBarProps {
  data: { username: string; email: string };

  handleLogout: () => void;
}
function NavBar({ data, handleLogout }: NavaBarProps) {
  return (
    <motion.div
      initial={{ x: 1000, opacity: 0 }}
      transition={{ type: "spring", stiffness:200 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex sm:hidden absolute right-0 top-[80px]  bg-gray-700 z-[888] w-[250px] h-[250px] duration-75 transition-all ease-in-out justify-center items-center rounded-b-xl"
    >
      <div className="flex items-center gap-4 sm:hidden flex-col">
        <div className="flex items-center gap-2 flex-col">
          <FaUserCircle className="text-4xl text-white" />
          <div className="text-center">
            <span className="text-white text-sm capitalize">
              Hello, <b>{data?.username || "Guest"}</b>
            </span>
            <p className="text-sm text-gray-300 truncate">{data?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-8 py-2 text-white rounded-md hover:bg-red-600 transition ml-4 sm:hidden flex"
        >
          Logout
        </button>
      </div>
    </motion.div>
  );
}

export default NavBar;
