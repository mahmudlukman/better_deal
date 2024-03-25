"use client"
import React, { useEffect } from 'react';
import Signup from '../../pages/auth/Signup';
import { redirect } from 'next/navigation';
import { useSelector } from 'react-redux';

const SignupPage = () => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      redirect('/');
    }
  }, [user]);
  return (
    <div>
      <Signup />
    </div>
  );
};

export default SignupPage;
