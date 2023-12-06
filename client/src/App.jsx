import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ActivationPage, LoginPage, SignupPage, HomePage } from './Routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { useEffect } from 'react';
// import store from './redux/store';
// import { loadUser } from './redux/actions/user';

const App = () => {
  // useEffect(() => {
  //   store.dispatch(loadUser());
  //   Store.dispatch(loadSeller());
  //   Store.dispatch(getAllProducts());
  //   Store.dispatch(getAllEvents());
  //   getStripeApikey();
  // }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignupPage />} />
        <Route
          path="/activation/:activation_token"
          element={<ActivationPage />}
        />
      </Routes>
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </BrowserRouter>
  );
};

export default App;
