import { SignUpFormData, FormErrors } from "./types";

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface PasswordStrength {
  score: number; // 0 to 4
  label: "Weak" | "Fair" | "Good" | "Strong";
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasLetter) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  if (password.length >= 12 && score >= 3) {
    score = 4;
  }

  let label: PasswordStrength["label"] = "Weak";
  if (score >= 4) label = "Strong";
  else if (score === 3) label = "Good";
  else if (score === 2) label = "Fair";
  else label = "Weak";

  return {
    score,
    label,
    hasMinLength,
    hasLetter,
    hasNumber,
    hasSpecial,
  };
}

export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,14}$/;

export function validateSignUpForm(data: SignUpFormData): FormErrors {
  const errors: FormErrors = {};

  // Full Name validation
  if (!data.fullName.trim()) {
    errors.fullName = "Enter your full name.";
  }

  // Email validation
  if (!data.email.trim()) {
    errors.email = "Enter a valid email address.";
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  // Phone validation
  if (!data.phoneNumber || !data.phoneNumber.trim()) {
    errors.phoneNumber = "Enter your phone number.";
  } else if (!PHONE_REGEX.test(data.phoneNumber.trim().replace(/\s/g, ""))) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  // Password validation
  if (!data.password) {
    errors.password = "Password must contain at least 8 characters.";
  } else if (data.password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  }

  // Confirm Password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  } else if (data.confirmPassword !== data.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  // Terms Agreement
  if (!data.agreedToTerms) {
    errors.agreedToTerms = "Please accept the Terms of Service.";
  }

  // Privacy Policy Agreement
  if (!data.agreedToPrivacy) {
    errors.agreedToPrivacy = "Please accept the Privacy Policy.";
  }

  // Identity Verification Consent
  if (!data.consentIdentityVerification) {
    errors.consentIdentityVerification = "Please provide identity verification consent.";
  }

  return errors;
}

export function validateField(
  fieldName: keyof SignUpFormData,
  value: string | boolean,
  formData: SignUpFormData
): string | undefined {
  switch (fieldName) {
    case "fullName":
      if (typeof value === "string" && !value.trim()) {
        return "Enter your full name.";
      }
      return undefined;

    case "email":
      if (typeof value === "string") {
        if (!value.trim()) return "Enter a valid email address.";
        if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address.";
      }
      return undefined;

    case "phoneNumber":
      if (typeof value === "string") {
        if (!value.trim()) return "Enter your phone number.";
        if (!PHONE_REGEX.test(value.trim().replace(/\s/g, ""))) return "Enter a valid phone number.";
      }
      return undefined;

    case "password":
      if (typeof value === "string") {
        if (!value) return "Password must contain at least 8 characters.";
        if (value.length < 8) return "Password must contain at least 8 characters.";
      }
      return undefined;

    case "confirmPassword":
      if (typeof value === "string") {
        if (!value) return "Passwords do not match.";
        if (value !== formData.password) return "Passwords do not match.";
      }
      return undefined;

    case "agreedToTerms":
      if (!value) {
        return "Please accept the Terms of Service.";
      }
      return undefined;

    case "agreedToPrivacy":
      if (!value) {
        return "Please accept the Privacy Policy.";
      }
      return undefined;

    case "consentIdentityVerification":
      if (!value) {
        return "Please provide identity verification consent.";
      }
      return undefined;

    default:
      return undefined;
  }
}

