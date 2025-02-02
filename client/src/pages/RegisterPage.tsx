import useAuthToken from "../../hooks/useAuth";
import Home from "../components/Home";
import Register from "../components/Register";

function RegisterPage() {
  const { getItem } = useAuthToken();
  const { token } = getItem();

  return <>{token! ? <Home /> : <Register />}</>;
}

export default RegisterPage;
