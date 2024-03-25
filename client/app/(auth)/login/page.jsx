"use client"
import React, {useEffect} from 'react';
import Login from '../../pages/auth/Login'
import { redirect } from 'next/navigation';
import { useSelector } from 'react-redux';

const LoginPage = () => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      redirect('/');
    }
  }, [user]);

  return (
    <div>
      <Login />
    </div>
  );
};

export default LoginPage;
