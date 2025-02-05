import useAuthToken from "../../hooks/useAuth";
import Login from "../components/Login";
import Home from "../components/Home";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function LoginPage() {
  const { getItem } = useAuthToken();
  const item = getItem();
  const token = item ? item.token : null;
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
