import { FaGithub, FaLink, FaLinkedin } from "react-icons/fa"


function Footer() {
  return (
    <footer
    className="flex items-center justify-center w-screen p-4  bottom-0 bg-gray-800 shadow-md  text-white flex-col gap-2"

    >
        

    
    <div className="flex items-center justify-center gap-4">
    <a href="https://david-mwas.me/" target="_blank" rel="noreferrer">
            <FaLink className="text-2xl text-white hover:text-gray-400" />
        </a>
        <a href="https://github.com/david-mwas/" target="_blank" rel="noreferrer">
            <FaGithub className="text-2xl text-white hover:text-gray-400" />
        </a>
        <a href="https://www.linkedin.com/in/david-mwangi-a57186235/" target="_blank" rel="noreferrer">
            <FaLinkedin className="text-2xl text-white hover:text-gray-400" />
        </a>
       
    </div>
    <p className="text-center text-base text-gray-300">Copyright ©  {""}
             {new Date().getFullYear()} SafeEnv. All rights reserved.
        </p>

    </footer>
  )
}

export default Footer