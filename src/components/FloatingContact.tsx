import { Phone, MessageCircle } from 'lucide-react';

export default function FloatingContact() {
  return (
    <div className="fixed right-5 bottom-6 z-[9999] flex flex-col gap-3">

      {/* Call Button */}
      <a
        href="tel:+91 8138837419"
        aria-label="Call us"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-blue-700"
      >
        <Phone size={25} />
      </a>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/918138837419"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-green-600"
      >
        <MessageCircle size={25} />
      </a>

    </div>
  );
}