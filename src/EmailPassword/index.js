"use client";

import React from "react";
import {
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  updateCurrentUser,
  updateProfile,
} from "firebase/auth";
import { useState, useRef, useEffect } from "react";
import { errors } from "../Errors";

import EmailField from "./EmailField";
import PasswordField from "./PasswordField";

import {
  validInputStyle,
  invalidInputStyle,
  labelStyle,
  descriptionStyle,
  buttonStyle,
  cancelButtonStyle,
} from "./defaultStyles";
import NameField from "./NameField";

export default function EmailPassword({
  auth,
  callbacks,
  authType = "both",
  setAlert,
  setError,
  continueUrl,
  passwordSpecs,
  setSendSMS,
  setMfaSignIn,
  formDisabledStyles,
  formButtonStyles,
  formInputStyles,
  displayName,
  formLabelStyles,
  formSmallButtonStyles,
  customErrors,
  setMfaResolver,
  fullLabel
}) {

  const [loading, setLoading] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);

  const [email, setEmail] = useState(urlParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [formIsValid, setFormIsValid] = useState(false);


  const [passwordValid, setPasswordValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [nameValid, setNameValid] = useState(false);

  const processNetworkError = (error) => {
    error = JSON.parse(JSON.stringify(error));
    if (error.code === 400 || error.code === "auth/network-request-failed" && error?.customData?.message) {
      let message = error.customData.message;
      let sliced = message.slice(32, message.length - 2)
      error.code = sliced;
    }

    return error;
  }


  useEffect(() => {
    setFormIsValid(
      passwordValid && emailValid && (displayName === "required" ? nameValid : true),
    );
  }, [emailValid, passwordValid, nameValid]);



  // MFA Resolver

  async function authenticateUser(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (authType === "signIn") {
      try {
        await signInWithEmailAndPassword(auth, email, password).then((userCred) => {
          if (callbacks?.signInSuccessWithAuthResult) callbacks.signInSuccessWithAuthResult(userCred)
        })
      } catch (error) {
        error = processNetworkError(error);
        setError(customErrors && customErrors[error.code] !== undefined ? customErrors[error.code] : errors[error.code] || error.code);

        if (callbacks?.signInFailure) callbacks.signInFailure(error)
      }
    } else {

      // first try to create an account
      try {

        await createUserWithEmailAndPassword(auth, email, password).then(async (userCred) => {
          if (displayName && name) {
            await updateProfile(auth.currentUser, { displayName: name }).then(() => {
              if (callbacks?.signInSuccessWithAuthResult) callbacks.signInSuccessWithAuthResult(userCred)
            })
          } else {
            if (callbacks?.signInSuccessWithAuthResult) callbacks.signInSuccessWithAuthResult(userCred)
          }
        })
        setLoading(false);
        return;
      } catch (err) {
        err = processNetworkError(err);
        if (err.code === "auth/email-already-in-use" && authType !== "signUp") {
          // because the user already has an account! Let's try signing them in...
          try {
            await signInWithEmailAndPassword(auth, email, password).then((userCred) => {
              if (callbacks?.signInSuccessWithAuthResult) callbacks.signInSuccessWithAuthResult(userCred)
            })
            setLoading(false);
            return;
          } catch (err2) {
            err2 = processNetworkError(err2);
            //const code2 = codeFromError(err2);
            if (err2.code === "auth/multi-factor-auth-required") {
              // signing them in didn't work because they have MFA enabled. Let's send them an MFA token
              setMfaResolver(getMultiFactorResolver(auth, err2))
              setMfaSignIn(true);
              setSendSMS(true);
            } else {
              // signing in didn't work for a different reason
              setError(customErrors && customErrors[err2.code] !== undefined ? customErrors[err2.code] : errors[err2.code] || err2.code);
              setLoading(false);
              if (callbacks?.signInFailure) callbacks.signInFailure(err2)
            }
          }
        } else {
          // creating an account didn't work for some other reason
          setLoading(false);
          setError(customErrors && customErrors[err.code] !== undefined ? customErrors[err.code] : errors[err.code] || err.code);
          if (callbacks?.signInFailure) callbacks.signInFailure(err)
        }
      }
    }
  }

  const [resetLinkSent, setResetLinkSent] = useState(false);

  async function onResetPassword() {
    try {
      await sendSignInLinkToEmail(auth, email, {
        handleCodeInApp: true,
        url: `${continueUrl}/?resetPassword=true&email=${email}`
      }).then(() => {
        setAlert(`A reset-password email has been sent to ${email}.`);
      });
    } catch (error) {
      error = processNetworkError(error);
      setError(customErrors && customErrors[error.code] !== undefined ? customErrors[error.code] : errors[error.code] || error.code);
    }
  }

  return (
    <form style={{ width: "100%" }} onSubmit={authenticateUser}>

      {displayName && <NameField
        value={name}
        setValue={setName}
        validInputStyle={validInputStyle}
        invalidInputStyle={invalidInputStyle}
        labelStyle={labelStyle}
        descriptionStyle={descriptionStyle}
        disabled={loading}
        formInputStyles={formInputStyles}
        formLabelStyles={formLabelStyles}
        setNameValid={setNameValid} />}

      <EmailField
        value={email}
        setValue={setEmail}
        validInputStyle={validInputStyle}
        invalidInputStyle={invalidInputStyle}
        labelStyle={labelStyle}
        descriptionStyle={descriptionStyle}
        disabled={loading}
        formInputStyles={formInputStyles}
        formLabelStyles={formLabelStyles}
        setEmailValid={setEmailValid}
      />

      <PasswordField
        value={password}
        setValue={setPassword}
        specs={passwordSpecs}
        validInputStyle={validInputStyle}
        invalidInputStyle={invalidInputStyle}
        labelStyle={labelStyle}
        descriptionStyle={descriptionStyle}
        newPassword={false}
        onResetPassword={onResetPassword}
        disabled={loading}
        formInputStyles={formInputStyles}
        formLabelStyles={formLabelStyles}
        setPasswordValid={setPasswordValid}
        authType={authType}
        emailValid={emailValid}
        setError={setError}
      />

      <button tabIndex="3" type="submit" disabled={loading || !formIsValid} style={{ ...buttonStyle, ...formButtonStyles, ...(formIsValid ? {} : { backgroundColor: "#696969", borderColor: "#2e2e2e", ...formDisabledStyles }) }}>
        {loading ? "Loading..." : fullLabel || "Log in or create account"}
      </button>
      {false && (
        <button
          style={{ ...cancelButtonStyle, ...formSmallButtonStyles, }}
          onClick={() => setEmailExists(null)}
        >
          Cancel
        </button>
      )}
    </form>
  );
}
