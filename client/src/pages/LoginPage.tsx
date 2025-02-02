import useAuthToken from "../../hooks/useAuth";
import Login from "../components/Login";
import Home from "../components/Home";

function LoginPage() {
  const { getItem } = useAuthToken();
  const { token } = getItem();

  return (
    <>
      <>{token! ? <Home /> : <Login />}</>;
    </>
  );
}

export default LoginPage;
