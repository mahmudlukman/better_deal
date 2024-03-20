'use client';
import React from 'react';
import { toast } from 'react-hot-toast';
import { VscWorkspaceTrusted } from 'react-icons/vsc';
import { useState, useRef } from 'react';
import styles from '../../styles/styles';
import { useSelector } from 'react-redux';
import { useActivationMutation } from '../../../redux/features/auth/authApi';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { BeatLoader } from 'react-spinners';

const Verification = () => {
  const { token } = useSelector((state) => state.auth);
  const [activation, { isSuccess, isLoading, error }] = useActivationMutation();
  const [invalidError, setInvalidError] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      toast.success('Account activated successfully');
      redirect('/login');
    }
    if (error) {
      if ('data' in error) {
        const errorData = error;
        toast.error(errorData.data.message);
        setInvalidError(true);
      } else {
        console.log('An error occurred', error);
      }
    }
  }, [isSuccess, error]);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const [verifyNumber, setVerifyNumber] = useState({
    0: '',
    1: '',
    2: '',
    3: '',
  });

  const verificationHandler = async () => {
    const verificationNumber = Object.values(verifyNumber).join('');
    if (verificationNumber.length !== 4) {
      setInvalidError(true);
      return;
    }
    await activation({
      activation_token: token,
      activation_code: verificationNumber,
    });
  };
  const handleInputChange = (index, value) => {
    setInvalidError(false);
    const newVerifyNumber = { ...verifyNumber, [index]: value };
    setVerifyNumber(newVerifyNumber);
    if (value === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (value.length === 1 && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Account
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="w-full flex items-center justify-center mt-2">
            <div className="w-[80px] h-[80px] rounded-full bg-blue-600 text-white flex items-center justify-center">
              <VscWorkspaceTrusted size={40} />
            </div>
          </div>
          <br />
          <br />
          <div className="m-auto flex items-center justify-around">
            {Object.keys(verifyNumber).map((key, index) => (
              <input
                type="number"
                key={key}
                ref={inputRefs[index]}
                className={`w-[65px] h-[65px] bg-transparent border-[3px] rounded-[10px] flex items-center text-black dark:text-white justify-center text-[18px] font-Poppins outline-none text-center ${
                  invalidError
                    ? 'shake border-red-500'
                    : 'dark:border-white border-[#0000004a]'
                }`}
                placeholder=""
                maxLength={1}
                value={verifyNumber[key]}
                onChange={(e) => handleInputChange(index, e.target.value)}
              />
            ))}
          </div>
          <br />
          <br />
          <div className="flex justify-center">
            <div
              className={`${styles.button} text-white bg-blue-600`}
              onClick={verificationHandler}
            >
              {isLoading ? <BeatLoader color="white" /> : 'Verify OTP'}
            </div>
          </div>
          <br />
          <h5 className="text-center pt-4 font-Poppins text-[14px] text-black dark:text-white">
            Go back to sign in?
            <span
              className="text-[#2190ff] pl-1 cursor-pointer"
              onClick={() => redirect('Login')}
            >
              Sign in
            </span>
          </h5>
        </div>
      </div>
    </div>
  );
};

export default Verification;
