const useAuthToken = () => {
  const getItem = () => {
    if (typeof window !== "undefined") {
      const token = localStorage?.getItem("safeEnv");
      //   const chatid = localStorage?.getItem("chatId");
      return { token }; // Return an object with token and chatid
    } else {
      // return { token: null, chatid: null };
    }
    // return { token: null }; // Return null if localStorage is not available
  };

  const clearAuthToken = () => {
    if (typeof window !== "undefined") {
      // Remove the token from local storage
      localStorage.removeItem("safeEnv");
      //   localStorage.removeItem("chatId");
    }
  };

  // Return the token and functions to update and clear it
  return { clearAuthToken, getItem };
};

export default useAuthToken;
