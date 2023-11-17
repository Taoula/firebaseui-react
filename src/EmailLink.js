import {
  getAuth,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from "firebase/auth";
import React, { useState, useEffect, useRef } from "react";
import { errors } from "./Errors";

export default function EmailLink({
  setEmailLinkOpen,
  resetContinueUrl,
  callbacks,
  setAlert,
  setError,
}) {
  const auth = getAuth();
  const [email, setEmail] = useState("");
  const [formIsValid, setFormIsValid] = useState(false);
  const [finishEmailSignIn, setFinishEmailSignIn] = useState(
    isSignInWithEmailLink(auth, window.location.href),
  );

  const emailRef = useRef(null);

  useEffect(() => {
    setFormIsValid(isEmailValid());
  }, [email]);

  const isEmailValid = function () {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const submit = async function (e) {
    e.preventDefault();
    try {
      if (finishEmailSignIn) {
        await signInWithEmailLink(auth, email, window.location.href).then(
          (user) => {
            if (callbacks?.signInSuccessWithAuthResult)
              callbacks.signInSuccessWithAuthResult(user);
            setEmailLinkOpen(false);
          },
        );
      } else {
        await sendSignInLinkToEmail(auth, email, {
          handleCodeInApp: true,
          url: resetContinueUrl,
        }).then(() => {
          setAlert(`A sign in link has been sent to ${email}`);
        });
      }
    } catch (error) {
      if (finishEmailSignIn && callbacks?.signInFailure)
        callbacks.signInFailure(error);
      setError(
        errors[error.code] === ""
          ? ""
          : errors[error.code] || "Something went wrong. Try again later.",
      );
    }
  };

  return (
    <>
      <div style={{ width: '100%', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
        <button
          onClick={() => setEmailLinkOpen(false)}
          style={{
            width: '100%',
            textAlign: 'left',
            fontSize: '0.875rem',
            color: '#2b6cb0', // blue-800
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#fff'
          }}
        >
          Go Back
        </button>
      </div>
      <h1 style={{ fontSize: '1.125rem', fontWeight: '600', marginTop: '0.5rem', marginBottom: '0.5rem' }}
      >Sign In With Email Link</h1>
      {finishEmailSignIn && (
        <p style={{ fontSize: '0.875rem' }}>Please re-enter your email address</p>
      )}
      <form style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '1rem',
        marginBottom: '1rem',
        gap: '1rem'
      }}>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1a202c', // gray-900
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <label for="email">Email Address</label>
          </div>
          <input
            ref={emailRef}
            name="email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              border: '1px solid #e2e8f0', // gray-300
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              width: '100%'
            }}





          />
        </div>
        <button
          type="submit"
          style={{
            color: 'white',
            fontWeight: '600',
            marginTop: '1.25rem',
            width: '100%',
            transition: 'background-color 150ms',
            backgroundColor: formIsValid ? '#60a5fa' : '#9ca3af', // bg-blue-400 for valid, bg-gray-400 for invalid
            cursor: formIsValid ? 'pointer' : 'default', // cursor changes based on form validity
            ...(formIsValid ? { ':hover': { backgroundColor: '#3b82f6' } } : {}), // hover effect for valid form
            display: 'flex',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            justifyContent: 'center',
            border: 'none',
          }}
          onClick={(e) => submit(e)}
        >
          {finishEmailSignIn ? "Finish Signing In" : "Send Email Link"}
        </button>
      </form>
    </>
  );
}
