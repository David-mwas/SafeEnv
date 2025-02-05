import { useNavigate } from "react-router-dom";
import useAuthToken from "../../hooks/useAuth";
import Home from "../components/Home";
import Register from "../components/Register";
import { useEffect } from "react";

function RegisterPage() {
  const { getItem } = useAuthToken();
  const item = getItem();
  const token = item ? item.token : null;

  const navigate = useNavigate();
  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, []);

  return <>{token! ? <Home /> : <Register />}</>;
}

export default RegisterPage;
