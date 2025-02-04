import useAuthToken from "../../hooks/useAuth";
import Login from "../components/ShareKeyLogin";
import Home from "../components/Home";

function LoginPage() {
  const { getItem } = useAuthToken();
  const { token } = getItem() || { token: null };

  return (
    <>
      <>{token! ? <Home /> : <Login />}</>;
    </>
  );
}

export default LoginPage;
