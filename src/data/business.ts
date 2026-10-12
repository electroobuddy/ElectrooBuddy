/**
 * Centralized business configuration.
 * All marketing claims, contact info, and business details live here
 * so they can be updated in one place without touching component code.
 */

export const BUSINESS = {
  // ── Brand ──────────────────────────────────────────────────────────────
  name: "ElectrooBuddy",
  tagline: "Ujjain's Most Trusted Since 1992",
  foundedYear: 1992,

  // ── Contact ────────────────────────────────────────────────────────────
  phone: "+917000395039",
  whatsappNumber: "917000395039",
  email: "electroobuddy@gmail.com",
  address: "05, Nagziri Dewas Road, Ujjain (456010), India",
  mapsUrl: "https://maps.app.goo.gl/X16Z1kxCfBUsKE9R9",

  // ── Social ─────────────────────────────────────────────────────────────
  social: {
    instagram: "https://www.instagram.com/electroo_buddy",
    // linkedin: "https://www.linkedin.com/company/electroobuddy",
  },

  // ── Business Hours ─────────────────────────────────────────────────────
  hours: {
    weekday: "24 x 7",
    // weekday: "Mon - Sat: 8:00 AM - 9:00 PM",
    sunday: "Sunday: Emergency Support Only",
    emergency: "24/7 Emergency Available",
    // Open/close hours for booking form logic
    openHour: 7,
    closeHour: 21,
  },

  // ── Google Maps Embed ──────────────────────────────────────────────────
  // Uses ElectrooBuddy business name instead of the old "Pragya Electric" name
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3668.612100355346!2d75.8147001!3d23.147849700000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396373645886aa75%3A0x8770f5f8e13dc716!2sElectrooBuddy!5e0!3m2!1sen!2sin!4v1773309507219!5m2!1sen!2sin",
} as const;

/** Derived helpers */
export const YEARS_OF_EXPERIENCE = new Date().getFullYear() - BUSINESS.foundedYear;
