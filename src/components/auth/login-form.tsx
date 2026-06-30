"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Fields = "email" | "password";
type Errors = Partial<Record<Fields, string>>;

function validate(values: Record<Fields, string>): Errors {
  const errors: Errors = {};

  if (!values.email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export function LoginForm() {
  const [values, setValues] = React.useState<Record<Fields, string>>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [touched, setTouched] = React.useState<Partial<Record<Fields, boolean>>>(
    {},
  );
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  function handleChange(field: Fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [field]: e.target.value };
      setValues(next);
      if (touched[field]) setErrors(validate(next));
    };
  }

  function handleBlur(field: Fields) {
    return () => {
      setTouched((t) => ({ ...t, [field]: true }));
      setErrors(validate(values));
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched({ email: true, password: true });
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      // TODO: replace with your auth request.
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          icon={Icons.mail}
          value={values.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email ? (
          <p id="email-error" className="text-sm text-danger">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          icon={Icons.lock}
          value={values.password}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="grid size-7 place-items-center rounded text-ink-subtle transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? (
                <Icons.eyeOff className="size-4" />
              ) : (
                <Icons.eye className="size-4" />
              )}
            </button>
          }
        />
        {errors.password ? (
          <p id="password-error" className="text-sm text-danger">
            {errors.password}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="w-full"
      >
        {submitting ? (
          <>
            <Icons.spinner className="animate-spin" />
            Signing in…
          </>
        ) : (
          "Log in"
        )}
      </Button>
    </form>
  );
}
