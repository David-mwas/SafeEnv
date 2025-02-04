import useAuthToken from "../../hooks/useAuth";
import Home from "../components/Home";
import Register from "../components/Register";

function RegisterPage() {
  const { getItem } = useAuthToken();
  const item = getItem();
  const token = item ? item.token : null;

  return <>{token! ? <Home /> : <Register />}</>;
}

export default RegisterPage;
