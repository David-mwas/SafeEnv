import { motion } from "framer-motion";
function Header() {
  return (
    <motion.h1
      className="text-3xl font-bold mb-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      SafeEnv
    </motion.h1>
  );
}

export default Header;
