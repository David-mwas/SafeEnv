import Home from "../components/Home";
import Auth from "../../hooks/useAuth";
import Login from "../components/Login";
import Footer from "../components/Footer";
function HomePage() {
  const { getItem } = Auth();
  const item = getItem();
  const token = item ? item.token : null;
  return (
    <>
      {token ? (
        <>
          <Home />
          <Footer />
        </>
      ) : (
        <Login />
      )}
    </>
  );
}

export default HomePage;
