import Home from "../components/Home";
import Auth from "../../hooks/useAuth";
import Login from "../components/Login";
function HomePage() {
  const { getItem, clearAuthToken } = Auth();
  const { token } = getItem();
  console.log(token);
  return <>{token! ? <Home /> : <Login />}</>;
}

export default HomePage;
