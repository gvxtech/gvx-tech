import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Mail, MapPin, Send, Phone } from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import SEO from '../seo/SEO';

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
    <>
    <SEO
  title="Contact GVX TECH | Start Your Digital Project"
  description="Have a digital project in mind? Contact GVX TECH for website development, custom software, mobile applications and digital transformation solutions."
  url="https://gvxtech.com/contact/"
/>
    
    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 bg-transparent dark:bg-black transition-colors duration-300">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left Column */}
          <div className="lg:col-span-5 stagger-item">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#777B84] dark:text-gray-400 mb-4">
              Start a Conversation
            </p>

            <h1
              className="font-display font-bold tracking-[-0.04em] text-[#101114] dark:text-white leading-[1.04]"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.15rem)', textWrap: 'balance' }}
            >
              Let’s Build Something{' '}
              <span className="gvx-gradient-text dark:bg-none dark:text-white dark:[-webkit-text-fill-color:white]">
                Great.
              </span>
            </h1>

            <p className="mt-6 text-base text-[#777B84] dark:text-gray-400 leading-relaxed max-w-[40ch]">
              Tell us about your product vision, timeline, or operational goals. Our engineering
              leads respond within one business day.
            </p>

            <div className="mt-10 pt-8 border-t border-[#E8EBF0] dark:border-[#262626] space-y-4">
              <div className="flex items-center gap-3 text-sm text-[#101114] dark:text-white">
                <Mail className="w-4 h-4 text-[#1677FF] shrink-0" strokeWidth={1.6} />
                <span>hello@gvxtech.io</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-[#101114] dark:text-white">
  <Phone className="w-4 h-4 text-[#1677FF] shrink-0" strokeWidth={1.6} />
  <span>+91 81388 37419</span>
</div>

<div className="flex items-center gap-3 text-sm text-[#101114] dark:text-white">
  <Phone className="w-4 h-4 text-[#1677FF] shrink-0" strokeWidth={1.6} />
  <span>+91 73061 23890</span>
</div>

              <div className="flex items-center gap-3 text-sm text-[#777B84] dark:text-gray-400">
                <MapPin className="w-4 h-4 text-[#1677FF] shrink-0" strokeWidth={1.6} />
                <span>India · Kerala · Kochi</span>
              </div>



{/* Social Icons */}
<div className="flex items-center gap-2 text-[#777B84] dark:text-gray-400">

  {/* LinkedIn */}
  <a
    href="https://www.linkedin.com"
    target="_blank"
    rel="noreferrer"
    aria-label="GVX TECH on LinkedIn"
    className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#0A66C2] hover:bg-[#E8F4FF] dark:hover:bg-white/10 hover:shadow-md"
  >
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  </a>

  {/* X */}
  <a
    href="https://x.com"
    target="_blank"
    rel="noreferrer"
    aria-label="GVX TECH on X"
    className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:shadow-md"
  >
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l16 16" />
      <path d="M20 4L4 20" />
    </svg>
  </a>

  {/* Facebook */}
  <a
    href="https://www.facebook.com"
    target="_blank"
    rel="noreferrer"
    aria-label="GVX TECH on Facebook"
    className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#1877F2] hover:bg-[#EAF3FF] dark:hover:bg-white/10 hover:shadow-md"
  >
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H8v3h2.1v8h3.4z" />
    </svg>
  </a>

  {/* Instagram */}
  <a
    href="https://www.instagram.com"
    target="_blank"
    rel="noreferrer"
    aria-label="GVX TECH on Instagram"
    className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#E1306C] hover:bg-[#FFF0F5] dark:hover:bg-white/10 hover:shadow-md"
  >
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  </a>

  {/* YouTube */}
  <a
    href="https://www.youtube.com"
    target="_blank"
    rel="noreferrer"
    aria-label="GVX TECH on YouTube"
    className="group p-2 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:text-[#FF0000] hover:bg-[#FFF0F0] dark:hover:bg-white/10 hover:shadow-md"
  >
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12a31 31 0 0 0-.5-4.8zM9.5 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  </a>

</div>


            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#E8EBF0] dark:border-[#262626] bg-white dark:bg-[#111111] p-7 sm:p-10 transition-colors duration-300">

              {submitted ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-6 h-6" strokeWidth={1.6} />
                  </div>

                  <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-[#101114] dark:text-white">
                    Inquiry Received
                  </h2>

                  <p className="mt-2.5 text-sm text-[#777B84] dark:text-gray-400 max-w-md leading-relaxed">
                    Thank you, {values.name}. We have logged your project brief and will reach out
                    to <span className="text-[#101114] dark:text-white font-medium">{values.email}</span> within 24
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

                  {/* Prefilled Topic */}
                  {prefillSubject && (
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-[#0A0A0A] border border-[#E8EBF0] dark:border-[#262626] px-4 py-2.5 text-xs text-[#101114] dark:text-white">
                      <span>
                        Topic selected: <strong>{prefillSubject}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onClearPrefill?.();
                          setValues((prev) => ({ ...prev, description: '' }));
                        }}
                        className="text-[#777B84] dark:text-gray-400 hover:text-[#101114] dark:hover:text-white cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Name */}
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-medium text-[#101114] dark:text-white mb-2"
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
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-[#101114] dark:text-white placeholder:text-[#777B84]/70 bg-white dark:bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/25 transition-colors ${
                          errors.name
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E8EBF0] dark:border-[#262626] focus:border-[#1677FF]'
                        }`}
                      />

                      {errors.name && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-medium text-[#101114] dark:text-white mb-2"
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
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-[#101114] dark:text-white placeholder:text-[#777B84]/70 bg-white dark:bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/25 transition-colors ${
                          errors.email
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E8EBF0] dark:border-[#262626] focus:border-[#1677FF]'
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

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-medium text-[#101114] dark:text-white mb-2"
                    >
                      Phone
                    </label>

                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 8967843573"
                      value={values.phone}
                      onChange={(e) => {
                        setValues((prev) => ({ ...prev, phone: e.target.value }));
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      aria-invalid={Boolean(errors.phone)}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-[#101114] dark:text-white placeholder:text-[#777B84]/70 bg-white dark:bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/25 transition-colors ${
                        errors.phone
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#E8EBF0] dark:border-[#262626] focus:border-[#1677FF]'
                      }`}
                    />

                    {errors.phone && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Project Description */}
                  <div>
                    <label
                      htmlFor="contact-description"
                      className="block text-xs font-medium text-[#101114] dark:text-white mb-2"
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
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-[#101114] dark:text-white placeholder:text-[#777B84]/70 bg-white dark:bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/25 transition-colors resize-y ${
                        errors.description
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#E8EBF0] dark:border-[#262626] focus:border-[#1677FF]'
                      }`}
                    />

                    {errors.description && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.description}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
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
    </>
  );
}