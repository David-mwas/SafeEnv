import useAuthToken from "../../hooks/useAuth";
import Login from "../components/ShareKeyLogin";
import Home from "../components/Home";
import { useLocation } from "react-router-dom";

function LoginPage() {
  const location = useLocation();

  const { getItem } = useAuthToken();
  const { token } = getItem() || { token: null };

  const url = import.meta.env.VITE_FRONTEND_URL + location?.pathname;

  return (
    <>
      <>{token! ? <Home /> : <Login url={url} />}</>;
    </>
  );
}

export default LoginPage;
