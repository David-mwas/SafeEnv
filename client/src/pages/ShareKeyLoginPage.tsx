import useAuthToken from "../../hooks/useAuth";
import Login from "../components/ShareKeyLogin";
import Home from "../components/Home";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const { getItem } = useAuthToken();
  const { token } = getItem() || { token: null };
  const navigate = useNavigate();
  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, []);

  return (
    <>
      <>{token! ? <Home /> : <Login />}</>;
    </>
  );
}

export default LoginPage;
