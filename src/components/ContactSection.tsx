import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Mail, MapPin, Send } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

interface ContactSectionProps {
  prefillSubject?: string | null;
  onClearPrefill?: () => void;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  description: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
}

export function ContactSection({ prefillSubject, onClearPrefill }: ContactSectionProps) {
  const [values, setValues] = useState<FormValues>({
    name: '',
    email: '',
    phone: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (prefillSubject) {
      setSubmitted(false);
      setValues((prev) => ({
        ...prev,
        description: prev.description.includes(prefillSubject)
          ? prev.description
          : `Interested in discussing: ${prefillSubject}.\n\n`,
      }));
    }
  }, [prefillSubject]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!values.name.trim() || values.name.trim().length < 2) {
      next.name = 'Please enter your full name.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    const digits = values.phone.replace(/[^\d]/g, '');
    if (digits.length < 7) {
      next.phone = 'Please enter a valid phone number.';
    }
    if (!values.description.trim() || values.description.trim().length < 10) {
      next.description = 'Please share a brief description of your project (at least 10 characters).';
    }
    return next;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitted(true);
    onClearPrefill?.();
  };

  return (
    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 bg-transparent">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 stagger-item">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#777B84] mb-4">
              Start a Conversation
            </p>
            <h1
              className="font-display font-bold tracking-[-0.04em] text-[#101114] leading-[1.04]"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.15rem)', textWrap: 'balance' }}
            >
              Let’s Build Something <span className="gvx-gradient-text">Great.</span>
            </h1>
            <p className="mt-6 text-base text-[#777B84] leading-relaxed max-w-[40ch]">
              Tell us about your product vision, timeline, or operational goals. Our engineering
              leads respond within one business day.
            </p>

            <div className="mt-10 pt-8 border-t border-[#E8EBF0] space-y-4">
              <div className="flex items-center gap-3 text-sm text-[#101114]">
                <Mail className="w-4 h-4 text-[#1677FF] shrink-0" strokeWidth={1.6} />
                <span>hello@gvxtech.io</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#777B84]">
                <MapPin className="w-4 h-4 text-[#1677FF] shrink-0" strokeWidth={1.6} />
                <span>San Francisco · London · Remote Worldwide</span>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#E8EBF0] bg-white p-7 sm:p-10">
              {submitted ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-6 h-6" strokeWidth={1.6} />
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-[#101114]">
                    Inquiry Received
                  </h2>
                  <p className="mt-2.5 text-sm text-[#777B84] max-w-md leading-relaxed">
                    Thank you, {values.name}. We have logged your project brief and will reach out
                    to <span className="text-[#101114] font-medium">{values.email}</span> within 24
                    hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setValues({ name: '', email: '', phone: '', description: '' });
                    }}
                    className="mt-7 text-sm font-medium text-[#1677FF] hover:text-[#0958D9] transition-colors cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {prefillSubject && (
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-white border border-[#E8EBF0] px-4 py-2.5 text-xs text-[#101114]">
                      <span>
                        Topic selected: <strong>{prefillSubject}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClearPrefill?.();
                          setValues((prev) => ({ ...prev, description: '' }));
                        }}
                        className="text-[#777B84] hover:text-[#101114] cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-medium text-[#101114] mb-2"
                      >
                        Name
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Alex Morgan"
                        value={values.name}
                        onChange={(e) => {
                          setValues((prev) => ({ ...prev, name: e.target.value }));
                          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        aria-invalid={Boolean(errors.name)}
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-[#101114] placeholder:text-[#777B84]/70 bg-white focus:outline-none focus:ring-2 focus:ring-[#1677FF]/25 transition-colors ${
                          errors.name
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E8EBF0] focus:border-[#1677FF]'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.name}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-medium text-[#101114] mb-2"
                      >
                        Email
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="alex@company.com"
                        value={values.email}
                        onChange={(e) => {
                          setValues((prev) => ({ ...prev, email: e.target.value }));
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        aria-invalid={Boolean(errors.email)}
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-[#101114] placeholder:text-[#777B84]/70 bg-white focus:outline-none focus:ring-2 focus:ring-[#1677FF]/25 transition-colors ${
                          errors.email
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E8EBF0] focus:border-[#1677FF]'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-medium text-[#101114] mb-2"
                    >
                      Phone
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+1 (415) 555-0192"
                      value={values.phone}
                      onChange={(e) => {
                        setValues((prev) => ({ ...prev, phone: e.target.value }));
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      aria-invalid={Boolean(errors.phone)}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-[#101114] placeholder:text-[#777B84]/70 bg-white focus:outline-none focus:ring-2 focus:ring-[#1677FF]/25 transition-colors ${
                        errors.phone
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#E8EBF0] focus:border-[#1677FF]'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-description"
                      className="block text-xs font-medium text-[#101114] mb-2"
                    >
                      Project description
                    </label>
                    <textarea
                      id="contact-description"
                      name="description"
                      rows={4}
                      placeholder="Share your goals, key features, or workflow challenges..."
                      value={values.description}
                      onChange={(e) => {
                        setValues((prev) => ({ ...prev, description: e.target.value }));
                        if (errors.description)
                          setErrors((prev) => ({ ...prev, description: undefined }));
                      }}
                      aria-invalid={Boolean(errors.description)}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-[#101114] placeholder:text-[#777B84]/70 bg-white focus:outline-none focus:ring-2 focus:ring-[#1677FF]/25 transition-colors resize-y ${
                        errors.description
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#E8EBF0] focus:border-[#1677FF]'
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.description}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <MagneticButton
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto"
                    >
                      Send Project Inquiry
                      <Send className="w-4 h-4" strokeWidth={1.75} />
                    </MagneticButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
