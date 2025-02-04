import Home from "../components/Home";
import Auth from "../../hooks/useAuth";
import Login from "../components/Login";
function HomePage() {
  const { getItem } = Auth();
  const item = getItem();
  const token = item ? item.token : null;
  console.log(token);
  return <>{token ? <Home /> : <Login />}</>;
}

export default HomePage;
